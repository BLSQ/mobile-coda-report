import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
    // The app is only ever run inside the native WebView, which injects
    // this global bridge. Stub it so App() can render in a plain DOM/Jest
    // environment.
    // @ts-ignore
    global.Android = {
        loadForms: () => JSON.stringify([]),
        currentOrgUnit: () => JSON.stringify({}),
        info: () => JSON.stringify({ app_id: 'org.bluesquare.coda2' }),
    };
});

test('renders the beneficiary type selection screen', () => {
    render(<App />);
    expect(screen.getByText(/choose beneficiary type/i)).toBeInTheDocument();
    expect(screen.getByText(/children under 5/i)).toBeInTheDocument();
    expect(
        screen.getByText(/pregnant and breastfeeding women and girls/i),
    ).toBeInTheDocument();
});
