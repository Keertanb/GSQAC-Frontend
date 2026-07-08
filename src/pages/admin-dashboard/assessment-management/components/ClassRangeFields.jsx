import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { CLASS_OPTIONS } from "../../../../utils/classRange";

export function ClassRangeFields({
  lowerClass,
  upperClass,
  onLowerClassChange,
  onUpperClassChange,
  lowerLabel = "Lower class",
  upperLabel = "Upper class",
  size = "small",
  disabled = false,
}) {
  return (
    <>
      <FormControl size={size} sx={{ minWidth: 120 }} disabled={disabled}>
        <InputLabel>{lowerLabel}</InputLabel>
        <Select
          label={lowerLabel}
          value={lowerClass}
          onChange={(e) => onLowerClassChange(Number(e.target.value))}
        >
          {CLASS_OPTIONS.map((value) => (
            <MenuItem key={`lower-${value}`} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size={size} sx={{ minWidth: 120 }} disabled={disabled}>
        <InputLabel>{upperLabel}</InputLabel>
        <Select
          label={upperLabel}
          value={upperClass}
          onChange={(e) => onUpperClassChange(Number(e.target.value))}
        >
          {CLASS_OPTIONS.filter((value) => value >= lowerClass).map((value) => (
            <MenuItem key={`upper-${value}`} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}
