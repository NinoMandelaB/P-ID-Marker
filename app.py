import streamlit as st
from streamlit_drawable_canvas import st_canvas
import fitz  # PyMuPDF
from PIL import Image
import io
import psycopg2
import psycopg2.extras
import os
import pandas as pd

def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get('PGHOST', 'localhost'),
        database=os.environ.get('PGDATABASE', 'pid_db'),
        user=os.environ.get('PGUSER', 'postgres'),
        password=os.environ.get('PGPASSWORD', 'postgres'),
        port=os.environ.get('PGPORT', '5432')
    )

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pid_documents (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(256),
            pdf_data BYTEA,
            uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS elements (
            id SERIAL PRIMARY KEY,
            pid_doc_id INTEGER REFERENCES pid_documents(id),
            type VARCHAR(100), 
            serial_number VARCHAR(100),
            position VARCHAR(100),
            internal_number VARCHAR(100),
            photo BYTEA,
            photo_filename VARCHAR(256),
            attachment BYTEA,
            attachment_filename VARCHAR(256),
            overlay_page INTEGER,
            overlay_x FLOAT,
            overlay_y FLOAT,
            overlay_type VARCHAR(32),
            overlay_color VARCHAR(32)
        );
    """)
    conn.commit()
    conn.close()

def pdf_page_to_pil(pdf_bytes: bytes, page_no: int) -> Image.Image:
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        page = doc.load_page(page_no)
        pix = page.get_pixmap(matrix=fitz.Matrix(2,2))  # higher resolution
        img_data = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_data))
        return image

def get_pdf_page_count(pdf_bytes: bytes) -> int:
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        return doc.page_count

st.set_page_config(page_title="P&ID Marker", layout="wide")

@st.cache_resource
def get_db():
    init_db()
    return True
get_db()

# Sidebar: PDF Upload and Selection
st.sidebar.header("P&ID Document")
conn = get_db_connection()

with st.sidebar:
    pdf_upload = st.file_uploader("Upload new P&ID (.pdf)", type=["pdf"], key="pdf_upl")
    if pdf_upload is not None:
        if st.button("Save PDF to database", key="save_pdf"):
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO pid_documents (filename, pdf_data) VALUES (%s, %s) RETURNING id;",
                (pdf_upload.name, pdf_upload.read())
            )
            conn.commit()
            st.success(f"{pdf_upload.name} uploaded.")

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT id, filename FROM pid_documents ORDER BY uploaded_at DESC;")
    all_pdfs = cur.fetchall()
    pdf_options = [f"{r['id']}: {r['filename']}" for r in all_pdfs]
    pdf_selected_index = st.selectbox("Select P&ID PDF", range(len(pdf_options)), format_func=lambda i: pdf_options[i] if pdf_options else "Upload one first")

    if all_pdfs:
        selected_pdf_id = all_pdfs[pdf_selected_index]['id']
        cur.execute("SELECT pdf_data FROM pid_documents WHERE id = %s;", (selected_pdf_id,))
        pdf_row = cur.fetchone()
        if pdf_row and pdf_row[0]:
            pdf_bytes = pdf_row[0]
            if not isinstance(pdf_bytes, bytes):
                pdf_bytes = bytes(pdf_bytes)
            selected_pdf_bytes = pdf_bytes
        else:
            selected_pdf_bytes = None
    else:
        selected_pdf_id = None
        selected_pdf_bytes = None

st.title("P&ID Marker – Interactive Annotation & Element Management")

if selected_pdf_bytes is None:
    st.info("Upload or select a P&ID PDF to start annotating.")
    st.stop()

# Page selection
n_pages = get_pdf_page_count(selected_pdf_bytes)
page_no = st.number_input(
    label="P&ID Page", min_value=0, max_value=n_pages-1, value=0
)
st.write(f"Page {page_no+1} of {n_pages}")
pdf_img = pdf_page_to_pil(selected_pdf_bytes, page_no)

# --- Drawing controls ---
edit_mode = st.sidebar.checkbox("Edit Mode", value=False)
drawing_mode = st.sidebar.selectbox(
    "Drawing tool",
    ["rect", "circle", "ellipse", "polygon", "line", "free_draw"],
    index=0
) if edit_mode else None

stroke_color = st.sidebar.color_picker("Stroke color", "#ff0000") if edit_mode else "#ff0000"
fill_color = st.sidebar.color_picker("Fill color", "#ff000040") if edit_mode else "#ff000040"
stroke_width = st.sidebar.slider("Stroke width", 1, 10, 3) if edit_mode else 3

col1, col2 = st.columns([3, 2])
with col1:
    st.subheader("Annotate P&ID")
    # Get elements/overlays for this PDF page
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "SELECT * FROM elements WHERE pid_doc_id = %s AND overlay_page = %s;", (selected_pdf_id, page_no)
    )
    overlays = cur.fetchall()
    overlay_shapes = []
    for el in overlays:
        overlay_shapes.append({
            "type": el.get("overlay_type", "rect"),
            "left": el['overlay_x'],
            "top": el['overlay_y'],
            "width": 40,
            "height": 40,
            "stroke": el.get("overlay_color", "red"),
            "fill": fill_color,
            "name": str(el['id']),
        })
    canvas_result = st_canvas(
        fill_color=fill_color,
        stroke_width=stroke_width,
        stroke_color=stroke_color,
        background_color="#fff",
        background_image=pdf_img,
        update_streamlit=True,
        height=pdf_img.height,
        width=pdf_img.width,
        drawing_mode=drawing_mode if edit_mode else None,
        key=f"canvas_{page_no}_{selected_pdf_id}",
        initial_drawing={"version": "4.4.0", "objects": overlay_shapes}
    )

    # Handle New Shape Added (edit mode only)
    if edit_mode and canvas_result.json_data and 'objects' in canvas_result.json_data:
        objects = canvas_result.json_data["objects"]
        new_objs = [
            o for o in objects
            if (not o.get("name") or o.get("name") == "")  # freshly drawn
        ]
        if new_objs:
            st.info("Shape drawn! Fill out below to link with a new element.")
            with st.form("add_element_for_annotation", clear_on_submit=True):
                type_ = st.text_input("Type of Element")
                serial = st.text_input("Serial Number")
                pos = st.text_input("Position")
                internal = st.text_input("Internal Number")
                photo = st.file_uploader("Photo of element", type=["jpg","jpeg","png"])
                attachment = st.file_uploader("Attachment (Datasheet etc.)", type=None)
                submit = st.form_submit_button("Save Element")
                if submit:
                    shape = new_objs[-1]  # last drawn, most recent
                    # Try get photo and attachment in bytes
                    photo_bytes = photo.read() if photo else None
                    photo_name = photo.name if photo else None
                    att_bytes = attachment.read() if attachment else None
                    att_name = attachment.name if attachment else None
                    # Insert into DB
                    cur2 = conn.cursor()
                    cur2.execute(
                        """
                        INSERT INTO elements
                        (pid_doc_id, type, serial_number, position, internal_number,
                        photo, photo_filename, attachment, attachment_filename,
                        overlay_page, overlay_x, overlay_y, overlay_type, overlay_color)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id;
                        """,
                        (
                            selected_pdf_id, type_, serial, pos, internal,
                            photo_bytes, photo_name,
                            att_bytes, att_name,
                            page_no, shape["left"], shape["top"], shape["type"], stroke_color
                        )
                    )
                    conn.commit()
                    st.success("Element created and linked to annotation shape. Refresh to see it on canvas.")

    # --- Show element info on shape click (when NOT in edit mode) ---
    if not edit_mode and canvas_result.json_data and 'objects' in canvas_result.json_data:
        clicked_idx = canvas_result.json_data.get("active")
        if (
            isinstance(clicked_idx, int)
            and clicked_idx < len(overlay_shapes)
            and overlays
        ):
            eid = int(overlay_shapes[clicked_idx].get("name", "0"))
            if eid:
                sel = [el for el in overlays if el['id'] == eid]
                if sel:
                    st.sidebar.success(f"Selected element: {sel[0]['type']} (Serial: {sel[0]['serial_number']})")
                    st.sidebar.json({
                        "ID": sel[0]['id'],
                        "Type": sel[0]['type'],
                        "Serial Number": sel[0]['serial_number'],
                        "Position": sel[0]['position'],
                        "Internal Number": sel[0]['internal_number'],
                        "Page": sel[0]['overlay_page'],
                        "Coordinates": [sel[0]['overlay_x'], sel[0]['overlay_y']]
                    })
                    if sel[0]['photo']:
                        st.sidebar.image(Image.open(io.BytesIO(sel[0]['photo'])), caption=sel[0]['photo_filename'], width=200)
                    if sel[0]['attachment']:
                        st.sidebar.download_button("Download Attachment", sel[0]['attachment'], sel[0]['attachment_filename'])

# Element Table
with col2:
    st.subheader("Element Management Table")
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "SELECT * FROM elements WHERE pid_doc_id = %s;",
        (selected_pdf_id,)
    )
    elements = cur.fetchall()
    table_data = []
    for el in elements:
        table_data.append({
            "ID": el['id'],
            "Type": el['type'],
            "Serial": el['serial_number'],
            "Position": el['position'],
            "Internal Number": el['internal_number'],
            "Page": el['overlay_page'],
            "X": round(el['overlay_x']) if el['overlay_x'] is not None else None,
            "Y": round(el['overlay_y']) if el['overlay_y'] is not None else None,
        })
    df = pd.DataFrame(table_data)
    selection = st.data_editor(df, use_container_width=True, hide_index=True)
    selected_rows = selection.get("selected_rows", [])
    if selected_rows:
        sel_id = df.loc[selected_rows[0]]["ID"]
        sel_el = [el for el in elements if el['id'] == sel_id][0]
        st.info(
            f"Element {sel_el['type']} @ Page {sel_el['overlay_page']+1} ({sel_el['overlay_x']:.0f}, {sel_el['overlay_y']:.0f})"
        )
        if sel_el['photo']:
            st.image(Image.open(io.BytesIO(sel_el['photo'])), caption=sel_el['photo_filename'], width=200)
        if sel_el['attachment']:
            st.download_button("Download Attachment", sel_el['attachment'], sel_el['attachment_filename'])
        st.markdown(f'*Jump to annotation by setting Page to {sel_el["overlay_page"]+1} and finding highlight*.')

conn.close()
