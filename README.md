# Mission Control

A lightweight, real-time dashboard for monitoring agent telemetry, built with a simple Node.js backend and a single-page HTML/JS/CSS frontend.

![Mission Control Screenshot](https://i.imgur.com/your-screenshot.png) <!-- You can replace this with a real screenshot URL later -->

## Features

-   **Real-Time Backend:** A Node.js server using WebSockets (`ws`) to broadcast telemetry data to all connected clients.
-   **Dynamic Frontend:** A vanilla JavaScript frontend (using Alpine.js for reactivity) that dynamically creates and updates agent cards as data is received.
-   **Simple Ingest:** A single HTTP endpoint (`POST /telemetry`) for agents to easily push their status updates.
-   **Self-Contained:** The server serves the `mission-control.html` file directly, making it easy to run.

## How to Run

1.  **Navigate to the Directory:**
    ```bash
    cd mission-control
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will start and listen on `http://localhost:8080`.

4.  **View the Dashboard:**
    Open your web browser and navigate to `http://localhost:8080`.

## How to Use

The backend is designed to receive data from your agents or any other service.

-   **Endpoint:** `POST /telemetry`
-   **Host:** The same host where the server is running (e.g., `http://localhost:8080/telemetry`)
-   **Body:** A JSON object with the following schema.

### Telemetry Schema

The server expects a JSON payload with the following structure. `agentId` and `status` are the minimum required fields.

```json
{
  "agentId": "string (Required, e.g., 'Agent-01')",
  "status": "string (Required, e.g., 'online', 'working', 'error')",
  "metrics": {
    "cpu": "number (e.g., 78)",
    "memory": "number (in MB, e.g., 256)",
    "uptime": "number (in seconds, e.g., 15)"
  },
  "logs": [
    "string (A list of log messages to display)"
  ]
}
```

**Example `curl` Command:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "agentId": "My-Test-Agent",
  "status": "working",
  "metrics": { "cpu": 50, "memory": 128 },
  "logs": ["Task started", "Processing data..."]
}' http://localhost:8080/telemetry
```
