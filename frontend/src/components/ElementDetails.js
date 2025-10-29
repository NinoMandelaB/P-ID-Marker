import React from 'react';
import { Typography, List, ListItem } from '@mui/material';

export default function ElementDetails({ element, attachments, comments }) {
  if (!element) return <div>Select an annotation.</div>;

  return (
    <div>
      <Typography variant="h6">Annotation Details</Typography>
      <Typography>Type: {element.element_type}</Typography>
      <Typography>Serial: {element.serial_number}</Typography>
      <Typography>Position: {element.position}</Typography>
      <Typography>Internal Number: {element.internal_number}</Typography>
      <Typography>Overlay: page {element.overlay_page}, x: {element.overlay_x}, y: {element.overlay_y}</Typography>
      <Typography variant="subtitle1">Attachments:</Typography>
      <List>
        {attachments && attachments.map(a => <ListItem key={a.id}>{a.filename}</ListItem>)}
      </List>
      <Typography variant="subtitle1">Comments:</Typography>
      <List>
        {comments && comments.map(c => <ListItem key={c.id}>{c.comment_text}</ListItem>)}
      </List>
    </div>
  );
}
