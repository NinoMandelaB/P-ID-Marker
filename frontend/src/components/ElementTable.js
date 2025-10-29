import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

export default function ElementTable({ elements, onSelect }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>Serial</TableCell>
          <TableCell>Position</TableCell>
          <TableCell>Internal Number</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {elements.map(e => (
          <TableRow key={e.id} hover onClick={() => onSelect(e)}>
            <TableCell>{e.element_type}</TableCell>
            <TableCell>{e.serial_number}</TableCell>
            <TableCell>{e.position}</TableCell>
            <TableCell>{e.internal_number}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
