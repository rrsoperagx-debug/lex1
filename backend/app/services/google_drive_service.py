# =============================================================================
# LexPortal Backend - Service for Google Drive Integration (google_drive_service.py)
# =============================================================================
#
# Ten serwis odpowiada za:
#   - Autoryzację w Google Cloud (Service Account / OAuth2).
#   - Tworzenie folderów na Dysku Google.
#   - Przesyłanie raportów (PDF) do dedykowanego folderu "LexPortal Reports".
#   - Zarządzanie uprawnieniami do przesłanych plików.
#
# =============================================================================

import os
import io
import json
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

logger = logging.getLogger(__name__)

class GoogleDriveService:
    def __init__(self):
        self.scopes = ['https://www.googleapis.com/auth/drive.file']
        self.service = self._get_drive_service()

    def _get_drive_service(self):
        """Initializes and returns the Google Drive API service."""
        try:
            creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            if creds_json:
                creds_info = json.loads(creds_json)
                creds = service_account.Credentials.from_service_account_info(
                    creds_info, scopes=self.scopes
                )
            else:
                # Fallback to local file if provided in .env
                creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                if creds_path and os.path.exists(creds_path):
                    creds = service_account.Credentials.from_service_account_file(
                        creds_path, scopes=self.scopes
                    )
                else:
                    logger.warning("Google Drive credentials not configured. Integration will be disabled.")
                    return None
            
            return build('drive', 'v3', credentials=creds)
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive service: {e}")
            return None

    def get_or_create_folder(self, folder_name="LexPortal Reports"):
        """Returns the ID of the folder, creating it if it doesn't exist."""
        if not self.service:
            return None
        
        try:
            query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            results = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
            items = results.get('files', [])
            
            if items:
                return items[0]['id']
            
            # Create folder
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = self.service.files().create(body=folder_metadata, fields='id').execute()
            logger.info(f"Created new folder on Google Drive: {folder_name} ({folder['id']})")
            return folder['id']
        except Exception as e:
            logger.error(f"Error getting/creating folder '{folder_name}': {e}")
            return None

    def upload_report_to_drive(self, file_content, filename, mime_type='application/pdf'):
        """Uploads a file to Google Drive and returns the webViewLink."""
        if not self.service:
            raise Exception("Google Drive service not initialized")
        
        try:
            folder_id = self.get_or_create_folder("LexPortal Reports")
            
            file_metadata = {
                'name': filename,
                'parents': [folder_id] if folder_id else []
            }
            
            fh = io.BytesIO(file_content)
            media = MediaIoBaseUpload(fh, mimetype=mime_type)
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink'
            ).execute()
            
            logger.info(f"File uploaded to Google Drive: {filename} ({file['id']})")
            
            # Set permissions to private (default is private for service account, but can be explicit)
            # Or if we want to make it visible to a specific user, we'd add permissions here.
            
            return file.get('webViewLink')
        except Exception as e:
            logger.error(f"Error uploading file to Google Drive: {e}")
            raise e

google_drive_service = GoogleDriveService()
