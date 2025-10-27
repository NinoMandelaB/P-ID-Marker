import streamlit as st
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from PIL import Image
import io
import fitz  # PyMuPDF for PDF handling
from datetime import datetime
import base64

# Database connection
def get_db_connection():
    """Establish database connection using environment variables"""
    try:
        conn = psycopg2.connect(
            host=os.environ.get('PGHOST', 'localhost'),
            database=os.environ.get('PGDATABASE', 'pid_db'),
            user=os.environ.get('PGUSER', 'postgres'),
            password=os.environ.get('PGPASSWORD', 'postgres'),
            port=os.environ.get('PGPORT', '5432')
        )
        return conn
    except Exception as e:
        st.error(f"Database connection failed: {e}")
        return None

# Initialize database tables
def init_db():
    """Create necessary database tables if they don't exist"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            
            # Create elements table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS elements (
                    id SERIAL PRIMARY KEY,
                    element_type VARCHAR(255) NOT NULL,
                    serial_number VARCHAR(255) UNIQUE NOT NULL,
                    position VARCHAR(255),
                    internal_number VARCHAR(255),
                    photo BYTEA,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create attachments table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS attachments (
                    id SERIAL PRIMARY KEY,
                    element_id INTEGER REFERENCES elements(id) ON DELETE CASCADE,
                    filename VARCHAR(255) NOT NULL,
                    file_data BYTEA NOT NULL,
                    file_type VARCHAR(50),
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create comments table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    element_id INTEGER REFERENCES elements(id) ON DELETE CASCADE,
                    comment_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create P&ID documents table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS pid_documents (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    file_data BYTEA NOT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            cur.close()
        except Exception as e:
            st.error(f"Database initialization failed: {e}")
        finally:
            conn.close()

# CRUD operations for elements
def create_element(element_type, serial_number, position, internal_number, photo_bytes=None):
    """Insert a new element into the database"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO elements (element_type, serial_number, position, internal_number, photo)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (element_type, serial_number, position, internal_number, photo_bytes))
            element_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return element_id
        except Exception as e:
            st.error(f"Error creating element: {e}")
            conn.close()
            return None

def get_all_elements():
    """Retrieve all elements from the database"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM elements ORDER BY created_at DESC")
            elements = cur.fetchall()
            cur.close()
            conn.close()
            return elements
        except Exception as e:
            st.error(f"Error retrieving elements: {e}")
            conn.close()
            return []

def get_element_by_id(element_id):
    """Retrieve a specific element by ID"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM elements WHERE id = %s", (element_id,))
            element = cur.fetchone()
            cur.close()
            conn.close()
            return element
        except Exception as e:
            st.error(f"Error retrieving element: {e}")
            conn.close()
            return None

def update_element(element_id, element_type, serial_number, position, internal_number, photo_bytes=None):
    """Update an existing element"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            if photo_bytes:
                cur.execute("""
                    UPDATE elements 
                    SET element_type = %s, serial_number = %s, position = %s, 
                        internal_number = %s, photo = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (element_type, serial_number, position, internal_number, photo_bytes, element_id))
            else:
                cur.execute("""
                    UPDATE elements 
                    SET element_type = %s, serial_number = %s, position = %s, 
                        internal_number = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (element_type, serial_number, position, internal_number, element_id))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            st.error(f"Error updating element: {e}")
            conn.close()
            return False

def delete_element(element_id):
    """Delete an element from the database"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM elements WHERE id = %s", (element_id,))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            st.error(f"Error deleting element: {e}")
            conn.close()
            return False

# Attachment operations
def add_attachment(element_id, filename, file_data, file_type):
    """Add an attachment to an element"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO attachments (element_id, filename, file_data, file_type)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (element_id, filename, file_data, file_type))
            attachment_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return attachment_id
        except Exception as e:
            st.error(f"Error adding attachment: {e}")
            conn.close()
            return None

def get_attachments(element_id):
    """Get all attachments for an element"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, filename, file_type, uploaded_at 
                FROM attachments 
                WHERE element_id = %s 
                ORDER BY uploaded_at DESC
            """, (element_id,))
            attachments = cur.fetchall()
            cur.close()
            conn.close()
            return attachments
        except Exception as e:
            st.error(f"Error retrieving attachments: {e}")
            conn.close()
            return []

def get_attachment_data(attachment_id):
    """Get attachment file data"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("SELECT filename, file_data, file_type FROM attachments WHERE id = %s", (attachment_id,))
            result = cur.fetchone()
            cur.close()
            conn.close()
            return result
        except Exception as e:
            st.error(f"Error retrieving attachment data: {e}")
            conn.close()
            return None

def delete_attachment(attachment_id):
    """Delete an attachment"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM attachments WHERE id = %s", (attachment_id,))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            st.error(f"Error deleting attachment: {e}")
            conn.close()
            return False

# Comment operations
def add_comment(element_id, comment_text):
    """Add a comment to an element"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO comments (element_id, comment_text)
                VALUES (%s, %s)
                RETURNING id
            """, (element_id, comment_text))
            comment_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return comment_id
        except Exception as e:
            st.error(f"Error adding comment: {e}")
            conn.close()
            return None

def get_comments(element_id):
    """Get all comments for an element"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT * FROM comments 
                WHERE element_id = %s 
                ORDER BY created_at DESC
            """, (element_id,))
            comments = cur.fetchall()
            cur.close()
            conn.close()
            return comments
        except Exception as e:
            st.error(f"Error retrieving comments: {e}")
            conn.close()
            return []

def delete_comment(comment_id):
    """Delete a comment"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            st.error(f"Error deleting comment: {e}")
            conn.close()
            return False

# P&ID document operations
def upload_pid_document(filename, file_data):
    """Upload a P&ID document"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO pid_documents (filename, file_data)
                VALUES (%s, %s)
                RETURNING id
            """, (filename, file_data))
            doc_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return doc_id
        except Exception as e:
            st.error(f"Error uploading P&ID document: {e}")
            conn.close()
            return None

def get_pid_documents():
    """Get all P&ID documents"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, filename, uploaded_at FROM pid_documents ORDER BY uploaded_at DESC")
            documents = cur.fetchall()
            cur.close()
            conn.close()
            return documents
        except Exception as e:
            st.error(f"Error retrieving P&ID documents: {e}")
            conn.close()
            return []

def get_pid_document_data(doc_id):
    """Get P&ID document data"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("SELECT filename, file_data FROM pid_documents WHERE id = %s", (doc_id,))
            result = cur.fetchone()
            cur.close()
            conn.close()
            return result
        except Exception as e:
            st.error(f"Error retrieving P&ID document data: {e}")
            conn.close()
            return None

def delete_pid_document(doc_id):
    """Delete a P&ID document"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM pid_documents WHERE id = %s", (doc_id,))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            st.error(f"Error deleting P&ID document: {e}")
            conn.close()
            return False

# PDF viewer function
def display_pdf(pdf_bytes):
    """Display PDF in Streamlit"""
    base64_pdf = base64.b64encode(pdf_bytes).decode('utf-8')
    pdf_display = f'<iframe src="data:application/pdf;base64,{base64_pdf}" width="700" height="1000" type="application/pdf"></iframe>'
    st.markdown(pdf_display, unsafe_allow_html=True)

# Main Streamlit App
def main():
    st.set_page_config(page_title="P&ID Maker", page_icon="🏭", layout="wide")
    
    st.title("🏭 P&ID Maker")
    st.markdown("### Piping and Instrumentation Diagram Management System")
    
    # Initialize database
    init_db()
    
    # Sidebar navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Go to", ["P&ID Documents", "Elements Management", "View All Elements"])
    
    if page == "P&ID Documents":
        st.header("📄 P&ID Documents")
        
        # Upload P&ID
        st.subheader("Upload New P&ID")
        uploaded_file = st.file_uploader("Upload P&ID (PDF)", type=['pdf'])
        
        if uploaded_file is not None:
            if st.button("Save P&ID Document"):
                pdf_bytes = uploaded_file.read()
                doc_id = upload_pid_document(uploaded_file.name, pdf_bytes)
                if doc_id:
                    st.success(f"✅ P&ID document uploaded successfully! (ID: {doc_id})")
                    st.rerun()
        
        # Display existing P&IDs
        st.subheader("Existing P&ID Documents")
        documents = get_pid_documents()
        
        if documents:
            for doc in documents:
                col1, col2, col3 = st.columns([3, 2, 1])
                with col1:
                    st.write(f"📋 **{doc['filename']}**")
                with col2:
                    st.write(f"Uploaded: {doc['uploaded_at'].strftime('%Y-%m-%d %H:%M')}")
                with col3:
                    if st.button("View", key=f"view_{doc['id']}"):
                        st.session_state[f"viewing_doc_{doc['id']}"] = True
                    if st.button("Delete", key=f"del_doc_{doc['id']}"):
                        if delete_pid_document(doc['id']):
                            st.success("Document deleted!")
                            st.rerun()
                
                # Display PDF if viewing
                if st.session_state.get(f"viewing_doc_{doc['id']}", False):
                    doc_data = get_pid_document_data(doc['id'])
                    if doc_data:
                        st.write("---")
                        display_pdf(doc_data[1])
                        st.write("---")
        else:
            st.info("No P&ID documents uploaded yet.")
    
    elif page == "Elements Management":
        st.header("⚙️ Elements Management")
        
        tab1, tab2 = st.tabs(["Add New Element", "Edit Existing Element"])
        
        with tab1:
            st.subheader("Add New Element")
            
            with st.form("add_element_form"):
                element_type = st.text_input("Element Type*", placeholder="e.g., Valve, Pump, Tank")
                serial_number = st.text_input("Serial Number*", placeholder="e.g., V-001")
                position = st.text_input("Position", placeholder="e.g., Building A, Floor 2")
                internal_number = st.text_input("Internal Number", placeholder="e.g., INT-12345")
                
                photo = st.file_uploader("Upload Photo", type=['png', 'jpg', 'jpeg'])
                
                submit = st.form_submit_button("Add Element")
                
                if submit:
                    if not element_type or not serial_number:
                        st.error("Element Type and Serial Number are required!")
                    else:
                        photo_bytes = photo.read() if photo else None
                        element_id = create_element(element_type, serial_number, position, internal_number, photo_bytes)
                        if element_id:
                            st.success(f"✅ Element added successfully! (ID: {element_id})")
                            st.rerun()
        
        with tab2:
            st.subheader("Edit Existing Element")
            
            elements = get_all_elements()
            if elements:
                element_options = {f"{e['serial_number']} - {e['element_type']}": e['id'] for e in elements}
                selected_element = st.selectbox("Select Element to Edit", options=list(element_options.keys()))
                
                if selected_element:
                    element_id = element_options[selected_element]
                    element = get_element_by_id(element_id)
                    
                    with st.form("edit_element_form"):
                        element_type = st.text_input("Element Type*", value=element['element_type'])
                        serial_number = st.text_input("Serial Number*", value=element['serial_number'])
                        position = st.text_input("Position", value=element['position'] or "")
                        internal_number = st.text_input("Internal Number", value=element['internal_number'] or "")
                        
                        photo = st.file_uploader("Update Photo", type=['png', 'jpg', 'jpeg'])
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            update_btn = st.form_submit_button("Update Element")
                        with col2:
                            delete_btn = st.form_submit_button("Delete Element", type="secondary")
                        
                        if update_btn:
                            photo_bytes = photo.read() if photo else None
                            if update_element(element_id, element_type, serial_number, position, internal_number, photo_bytes):
                                st.success("✅ Element updated successfully!")
                                st.rerun()
                        
                        if delete_btn:
                            if delete_element(element_id):
                                st.success("✅ Element deleted successfully!")
                                st.rerun()
            else:
                st.info("No elements in database yet.")
    
    elif page == "View All Elements":
        st.header("📊 All Elements")
        
        elements = get_all_elements()
        
        if elements:
            for element in elements:
                with st.expander(f"🔧 {element['serial_number']} - {element['element_type']}"):
                    col1, col2 = st.columns([2, 1])
                    
                    with col1:
                        st.write(f"**Element Type:** {element['element_type']}")
                        st.write(f"**Serial Number:** {element['serial_number']}")
                        st.write(f"**Position:** {element['position'] or 'N/A'}")
                        st.write(f"**Internal Number:** {element['internal_number'] or 'N/A'}")
                        st.write(f"**Created:** {element['created_at'].strftime('%Y-%m-%d %H:%M')}")
                    
                    with col2:
                        if element['photo']:
                            try:
                                image = Image.open(io.BytesIO(element['photo']))
                                st.image(image, caption="Element Photo", use_container_width=True)
                            except:
                                st.write("Photo unavailable")
                    
                    # Comments section
                    st.write("---")
                    st.write("**💬 Comments**")
                    
                    comments = get_comments(element['id'])
                    if comments:
                        for comment in comments:
                            col1, col2 = st.columns([5, 1])
                            with col1:
                                st.text_area("", value=comment['comment_text'], height=50, disabled=True, key=f"comment_{comment['id']}")
                                st.caption(f"Posted: {comment['created_at'].strftime('%Y-%m-%d %H:%M')}")
                            with col2:
                                if st.button("🗑️", key=f"del_comment_{comment['id']}"):
                                    if delete_comment(comment['id']):
                                        st.success("Comment deleted!")
                                        st.rerun()
                    
                    # Add new comment
                    with st.form(f"comment_form_{element['id']}"):
                        new_comment = st.text_area("Add Comment", key=f"new_comment_{element['id']}")
                        if st.form_submit_button("Add Comment"):
                            if new_comment:
                                if add_comment(element['id'], new_comment):
                                    st.success("✅ Comment added!")
                                    st.rerun()
                    
                    # Attachments section
                    st.write("---")
                    st.write("**📎 Attachments**")
                    
                    attachments = get_attachments(element['id'])
                    if attachments:
                        for att in attachments:
                            col1, col2, col3 = st.columns([3, 2, 1])
                            with col1:
                                st.write(f"📄 {att['filename']}")
                            with col2:
                                st.caption(f"Uploaded: {att['uploaded_at'].strftime('%Y-%m-%d %H:%M')}")
                            with col3:
                                if st.button("Download", key=f"dl_att_{att['id']}"):
                                    att_data = get_attachment_data(att['id'])
                                    if att_data:
                                        st.download_button(
                                            label="⬇️ Download",
                                            data=att_data[1],
                                            file_name=att_data[0],
                                            key=f"dl_btn_{att['id']}"
                                        )
                                if st.button("🗑️", key=f"del_att_{att['id']}"):
                                    if delete_attachment(att['id']):
                                        st.success("Attachment deleted!")
                                        st.rerun()
                    
                    # Add new attachment
                    with st.form(f"attachment_form_{element['id']}"):
                        new_attachment = st.file_uploader("Add Attachment (Datasheets, etc.)", key=f"new_att_{element['id']}")
                        if st.form_submit_button("Upload Attachment"):
                            if new_attachment:
                                file_bytes = new_attachment.read()
                                file_type = new_attachment.type
                                if add_attachment(element['id'], new_attachment.name, file_bytes, file_type):
                                    st.success("✅ Attachment uploaded!")
                                    st.rerun()
        else:
            st.info("No elements in database yet. Add elements from the Elements Management page.")
    
    # Footer
    st.sidebar.markdown("---")
    st.sidebar.info("P&ID Maker v1.0\nBuilt with Streamlit & PostgreSQL")

if __name__ == "__main__":
    main()
