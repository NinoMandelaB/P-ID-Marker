# P&ID Maker

A comprehensive Piping and Instrumentation Diagram (P&ID) management system built with Streamlit and PostgreSQL.

## Features

- 📄 **P&ID Document Management**: Upload, view, and manage P&ID PDFs
- ⚙️ **Element Management**: Add, edit, and delete P&ID elements
- 💬 **Comments**: Add comments to elements for collaboration
- 📎 **Attachments**: Upload datasheets and other documents linked to elements
- 📸 **Photo Storage**: Store photos of physical elements
- 🗄️ **PostgreSQL Database**: Robust data storage with relational database

## Element Information Tracked

- Type of Element
- Serial Number
- Position
- Internal Number
- Photo
- Attachments (Datasheets, etc.)

## Deployment on Railway

### Prerequisites

- GitHub account
- Railway account
- PostgreSQL database (Railway provides this)

### Deploy to Railway

1. **Fork/Clone this repository**

2. **Create a new project on Railway**
   - Go to [Railway](https://railway.app/)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository

3. **Add PostgreSQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create a PostgreSQL instance

4. **Configure Environment Variables**
   
   Railway will automatically set the PostgreSQL environment variables:
   - `PGHOST`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGPORT`

   No additional configuration needed!

5. **Deploy**
   - Railway will automatically detect the Dockerfile
   - Click "Deploy"
   - Wait for the deployment to complete

6. **Access Your App**
   - Once deployed, Railway will provide a public URL
   - Click on the URL to access your P&ID Maker app

## Local Development

### Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/P-ID-maker.git
cd P-ID-maker
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up PostgreSQL database and configure environment variables:
```bash
# Create a .env file with:
PGHOST=localhost
PGDATABASE=pid_db
PGUSER=postgres
PGPASSWORD=your_password
PGPORT=5432
```

5. Run the app:
```bash
streamlit run app.py
```

6. Open your browser to `http://localhost:8501`

## Database Schema

### Elements Table
- `id`: Primary key
- `element_type`: Type of element (VARCHAR)
- `serial_number`: Unique serial number (VARCHAR)
- `position`: Physical position (VARCHAR)
- `internal_number`: Internal tracking number (VARCHAR)
- `photo`: Element photo (BYTEA)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Attachments Table
- `id`: Primary key
- `element_id`: Foreign key to elements
- `filename`: Name of the file (VARCHAR)
- `file_data`: File content (BYTEA)
- `file_type`: MIME type (VARCHAR)
- `uploaded_at`: Timestamp

### Comments Table
- `id`: Primary key
- `element_id`: Foreign key to elements
- `comment_text`: Comment content (TEXT)
- `created_at`: Timestamp

### P&ID Documents Table
- `id`: Primary key
- `filename`: Document name (VARCHAR)
- `file_data`: PDF content (BYTEA)
- `uploaded_at`: Timestamp

## Technologies Used

- **Frontend**: Streamlit
- **Database**: PostgreSQL
- **PDF Processing**: PyMuPDF (fitz)
- **Image Processing**: Pillow
- **Deployment**: Docker, Railway

## Usage Guide

### 1. Upload P&ID Documents
- Navigate to "P&ID Documents" page
- Upload PDF files of your P&ID diagrams
- View and manage uploaded documents

### 2. Add Elements
- Go to "Elements Management" → "Add New Element"
- Fill in element details (type, serial number, position, internal number)
- Upload a photo if available
- Click "Add Element"

### 3. Edit Elements
- Go to "Elements Management" → "Edit Existing Element"
- Select an element from the dropdown
- Update information as needed
- Upload new photo if needed
- Click "Update Element"

### 4. View and Manage All Elements
- Navigate to "View All Elements"
- Expand any element to see full details
- Add comments for collaboration
- Upload attachments (datasheets, manuals, etc.)
- Download attachments when needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.