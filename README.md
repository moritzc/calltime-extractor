# Teams/Skype Call Extractor

A simple web-based tool to extract, view, and export your call history from a Skype data export (`messages.json`).

This tool processes everything locally in your browser. **No data ever leaves your device.**

<img width="1159" height="752" alt="image" src="https://github.com/user-attachments/assets/60cea7a5-6f2d-44ce-a6ae-3ca1eefc21d5" />


## Features

-   **100% Private**: All data processing happens in your web browser. Your `messages.json` file is never uploaded to a server.
-   **Extract Call Logs**: Parses your `messages.json` file to find all call events.
-   **Easy Viewing**: Displays call logs in a clean, paginated table.
-   **Advanced Filtering**: Filter calls by person, identity, or a specific date/time range.
-   **Calculate Totals**: Automatically calculates the total duration of the filtered calls.
-   **Multiple Export Options**: Download your filtered call log as an `.xlsx` or `.xls` file.
-   **Timezone Support**: Display call timestamps in your local timezone, UTC, or other common timezones.

## How to Use

1.  **Export Your Skype Data**:
    -   Go to the official Teams data export page: [[https://secure.skype.com/en/data-export](https://secure.skype.com/en/data-export) or [https://go.skype.com/export](https://go.skype.com/export).](https://teams.live.com/dataexport).
    -   Select the option to export "Chat history".
    -   Submit the request. It may take some time for your export to be ready. You will receive a notification when it's available to download.
    -   Download the exported `.tar` file and extract it. Inside, you will find the `messages.json` file.

2.  **Upload to the Extractor**:
    -   Open the Call Extractor web page.
    -   Click the "Select file" button and choose the `messages.json` file you extracted.

3.  **Explore and Export**:
    -   Your call log will be displayed in the table.
    -   Use the filter controls to narrow down the data.
    -   Click the ".xls" or ".xlsx" buttons to download the filtered data.

## Development

To run the project locally for development:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/moritzc/calltime-extractor/
    cd calltime-extractor
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    This will start the application on `http://localhost:5173`.

## Build

To create a production build of the application:

1.  **Build the project**:
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the optimized, static assets.

2.  **Preview the build**:
    ```bash
    npm run preview
    ```
    This will serve the contents of the `dist` directory on `http://localhost:4173`.

## Docker

You can also build and run the application using Docker.

1.  **Build the Docker image**:
    ```bash
    docker build -t call-extractor .
    ```

2.  **Run the container**:
    ```bash
    docker run --rm -p 8080:80 call-extractor
    ```
    The application will be available at `http://localhost:8080`.

## Built With

-   [React](https://react.dev/)
-   [Vite](https://vitejs.dev/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [shadcn/ui](https://ui.shadcn.com/) (components)
-   [Lucide React](https://lucide.dev/guide/packages/lucide-react) (icons)
-   [SheetJS/xlsx](https://sheetjs.com/) (for `.xlsx` export)
