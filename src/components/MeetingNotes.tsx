import { useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MeetingNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export const MeetingNotes = ({ value, onChange }: MeetingNotesProps) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  return (
    <Card className="rounded-2xl shadow-xl border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary via-purple to-accent">
        <CardTitle className="text-white">Meeting Notes</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          className="min-h-[200px] bg-background"
        />
      </CardContent>
    </Card>
  );
};
