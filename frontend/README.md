# ReverseEngineer — KinderJoy prototype

A responsive frontend and small Node.js backend based on the supplied ReverseEngineer presentation.

## Run

Requires Node.js 18 or newer. From this directory:

```sh
node server.js
```

Then open <http://localhost:4173>. Set `PORT` to use another port.

## Included

- Drag-and-drop or browse to upload text, code, logs, JSON, CSV, or SVG files.
- A sample code workflow so the analysis screen can be explored without a file.
- `POST /api/analyze` returns inferred components, a reconstructed process, and ranked alternative hypotheses.
- `GET /api/health` reports whether the backend is available.

The analysis is a local heuristic prototype. Confidence values illustrate the deck's concept and are not produced by a trained AI model. Uploaded content is processed in memory and is not stored by the server.