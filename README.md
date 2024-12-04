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




# Production

## Prepare the report zip file to deploy
```
yarn run build
cd build/static/css
```
Cut all content of `css` folder

```
cd ../
```
Paste in the build folder

```
cd ../js
```
Cut all content of `js` folder
```
cd ../
```
Paste in the build folder as well

Open the `index.html` file with your code editor, make sure to have HTML plugin formatter activated then format the content file

In header tag, on: 
- line 8, with `<script></script>` tag, on the `src` attribute, remove the path `/static/js/`. Just keep the main css file name.
- line 9, with `<link>` tag  attribute, remove the path `/static/css/`.

In order to reference the right path, then remove css and js folder as they are empty.

Inside `build/static` folder, create zip file with the whole content by selecting all files then zip, provide the name for the zip and let the process finish compressing files .


## Deploy the report

Login with super user(with admin access) to django admin, then go to admin space.
e.g: https://qa.coda.go.wfp.org/admin/

### 1. Create new report version

Go to report version. e.g: https://qa.coda.go.wfp.org/admin/iaso/reportversion/

Create the version by making sure the status field is set to "Published"



### 2. Link the created report version to the report


Open report table. e.g: https://qa.coda.go.wfp.org/admin/iaso/report/

Create/Edit the report related to your project and link it to the version on the "Published version" field.






