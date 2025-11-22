# How to Run Images Come to Life Locally

## Quick Start

Due to browser security restrictions (CORS policy), this project cannot be run by simply opening the `index.html` file directly in your browser. You need to serve it via an HTTP server.

### Running the Server

1. Open a terminal in the project directory
2. Run the start script:
   ```bash
   ./start-server.sh
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Manual Server Setup

If the script doesn't work, you can manually start a server using one of these methods:

#### Using Python 3:
```bash
python3 -m http.server 8000
```

#### Using Python 2:
```bash
python -m SimpleHTTPServer 8000
```

#### Using Node.js:
```bash
npx http-server -p 8000
```

## Troubleshooting

### CORS Errors
If you see errors like "Access to fetch at 'file://...' has been blocked by CORS policy", it means you're trying to open the HTML file directly. Always use an HTTP server as described above.

### Missing Files
The project requires:
- `libs/three.js-dev/examples/js/loaders/LoaderSupport.js`
- `libs/three.js-dev/examples/js/loaders/OBJLoader2.js`

These files should now be in place. If they're missing, they can be downloaded from the three.js r97 repository.

## Project Info

This is a web-based 3D interactive application that allows images to come to life through mesh deformation.

For more information about the project, see the main [README.md](README.md).
