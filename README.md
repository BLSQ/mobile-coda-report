# Development

## Get the code and install the dependencies

```
git clone git@github.com:BLSQ/mobile-coda-report.git
cd mobile-coda-report
yarn install
```

## Start the server

```
yarn start
```

## Getting json sample data for development

It requires to have coda mobile app install debug version on your device. Debugging version allows to get sample data.

### Connect device to computer and run `scrcpy` command

e.g: `scrcpy` or `scrcpy -s R58MA48E00H` (R58MA48E00H is device id)

Open Coda mobile app on the device, then click in the See reports link on the left bottom in order to access the mobile report

From your chrome browser, enter `chrome://inspect/`, then inspect link, you should see the same report page as you get on your mobile device
In the browser console, tape:
- `Android.loadForms()`, copy the content and paste it in the  `/src/fake/FakeData.ts` as `FAKE_DATA` const content
- `Android.currentOrgUnit()` copy and paste it in `/src/fake/FakeLocalHealthFacility.ts` as `FAKE_LOCAL_HF` const content

## Developing the stock report

The "Stock Data" report (`STOCK` in `src/config/reportConfig.ts`) has two options:

| Option         | Component                            | Data processing               | Source form       |
| -------------- | ------------------------------------ | ----------------------------- | ----------------- |
| Food item      | `src/report/stock/FoodItems.tsx`     | `src/stock/FoodStock.ts`      | `food_item_stock` |
| Non Food item  | `src/report/stock/NonFoodItems.tsx`  | `src/stock/NonFoodStock.ts`   | `nfi_stocks`      |

The stock form ids of each country are listed in `stockForms` of `src/config/country/<country>.ts`.

### How the data is loaded

- **Non food items** use the forms loaded by `LoadFormsForEntityType('STOCK')` in `src/Android.tsx`
  (asynchronous `Android.loadForms()` scoped to `countryConfig.stockForms`). `processNonFoodStockData()`
  takes the first report of the period as opening balance, the last one as closing balance and sums
  received / utilised / discarded / stock out days.
- **Food items** load their data themselves, synchronously, through the native bridge:
  - `Android.getStockValueAt(date, orgUnitId)` (`foodInitialStock()` in `src/config/country/index.ts`)
    gives the opening balance of every item, in sachets, all batches combined. Keys are SKU names.
  - `Android.loadForms(orgUnitId, null, null, null, 'food_item_stock', null, null)` gives the
    `food_item_stock` submissions. `processFoodStockData()` adds the activities of the period
    (received, transferred, lost) per item and per batch row; end stock = opening + received −
    transferred − lost.
  - Every synchronous stock call goes through `callStockBridge()` (`src/stock/StockBridge.ts`), which
    works around a native bridge bug that would otherwise make the call return `undefined`. Do not
    call `Android.getStockValueAt()` / `Android.loadForms()` directly for stock.
- Quantities are expressed in sachets, boxes/cartons (+ loose sachets), kg and MT
  (`src/stock/FoodQuantity.ts`). Boxes are computed from `total_packets` and `packaging_size`;
  kg and MT come from `total_weight` and `tonnage` computed by the form.

### Form fields used by the food item report

- Commodity quantities: `total_<code>`, `total_<code>_transfered` (or `_transferred`),
  `total_<code>_losses`. The commodity codes (`wsb`, `wsbp`, `lns_mq`, `lns_sq`, `rusf`, `rutf`,
  `oil`) map to SKU names in `COMMODITY_TO_SKU` (`src/stock/FoodStock.ts`). **When adding a
  commodity, add it there**, with the exact SKU name returned by `Android.getStockValueAt()`.
- Batch row: `batch_number`, `quantity_unit_label` / `unit`, `packaging_size`, `box_size`,
  `expiry_date` (only entered on reception, possibly before the period).
- Date of the activity: `stock_management_date`, falling back to `createdAt`.
- Loss / transfer reasons: first non-empty field of `LOSS_REASON_FIELDS` / `TRANSFER_REASON_FIELDS`.

### Running the stock report locally with fake data

Outside the Coda app there is no `Android` bridge, so switch to the fake data (and **revert before
committing / building**):

1. Get sample data from the device (see above) and from the browser console:
   - `Android.loadForms(<orgUnitId>, null, null, null, 'food_item_stock', null, null)` → paste in
     `src/fake/FakeData.ts` (`FAKE_DATA`)
   - `Android.getStockValueAt('<yyyy-MM-dd>', <orgUnitId>)` → paste in
     `src/fake/FakeDefaultStockData.ts` (`DEFAULT_STOCK`)
   - `Android.currentOrgUnit()` → paste in `src/fake/FakeLocalHealthFacility.ts` (`FAKE_LOCAL_HF`)
2. Swap the commented lines for the fake ones in:
   - `src/stock/FoodStock.ts`: `FAKE_DATA` / `FAKE_LOCAL_HF` imports, `currentOrgUnitId()` and
     `loadFoodStockSubmissions()`
   - `src/config/country/index.ts`: `DEFAULT_STOCK` import and `foodInitialStock()`, and the
     hard-coded `info` in `readAppId()` to pick the country (e.g. Bangladesh)
   - `src/Android.tsx`: fake imports, the `FAKE_LOCAL_HF` line of `loadEntityTypeForms()` and the
     commented `window.postMessage(...)` block of `loadForms()` (needed for the non food items)
3. `yarn start`, choose "Stock Data" then "Food item" or "Non Food item".

To test on a device instead, build and deploy the report (see Production) or debug it with
`chrome://inspect/` while the Coda debug app is open.

### Tests

The processing is covered by unit tests that mock the `Android` bridge:

```
yarn test src/stock
```

- `src/stock/FoodStock.test.ts`: opening/end stock, batches, reasons, period filtering
- `src/stock/FoodQuantity.test.ts`: sachets ↔ boxes/cartons conversions
- `src/stock/NonFoodStock.test.ts`: non food item balances
- `src/stock/StockBridge.test.ts`: bridge callback workaround

When changing the stock report, add a case there first (build submissions with the `submission()`
helper of `FoodStock.test.ts`), then run `yarn lint` and `yarn format:check`.




# Production

## Prepare the report zip file to deploy

From the root of the project, run:

```
./build.sh
```

The script does the whole process:

1. Writes the latest git commit id and the build time in `src/app-version.ts` (use `./build.sh long`
   for the full commit id, or set `GIT_SHA` to force a value).
2. Runs the production build (`npm run build`, same as `yarn run build`).
3. Moves the css and js files from `build/static/css` and `build/static/js` to the root of `build`,
   then removes `build/static`.
4. Fixes the paths in `build/index.html` (`/static/js` and `/static/css` become `.`).
5. Zips the content of `build` into `report.zip` at the root of the project.

`report.zip` is the file to upload in the report version (see below).

Notes:

- Requires the `zip` command (`sudo apt install zip`).
- Delete the previous `report.zip` before running the script: `zip` adds to an existing archive, so
  files from an older build would stay in it.
- `src/app-version.ts` is modified by the script: commit it with the release.


## Deploy the report

Login with super user(with admin access) to django admin, then go to admin space.
e.g: https://qa.coda.go.wfp.org/admin/

### 1. Create new report version

Go to report version. e.g: https://qa.coda.go.wfp.org/admin/iaso/reportversion/

Create the version:

- Upload the `report.zip` file generated by `./build.sh` (at the root of the project) in the file field
- Make sure the status field is set to "Published"



### 2. Link the created report version to the report


Open report table. e.g: https://qa.coda.go.wfp.org/admin/iaso/report/

Create/Edit the report related to your project and link it to the version on the "Published version" field.






