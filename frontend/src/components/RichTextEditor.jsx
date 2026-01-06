import { useEffect, useRef } from "react";

const inlineButtons = [
  { icon: <strong>B</strong>, command: "bold", title: "Đậm" },
  { icon: <em>I</em>, command: "italic", title: "Nghiêng" },
  { icon: <u>U</u>, command: "underline", title: "Gạch chân" },
  { icon: <span style={{ textDecoration: "line-through" }}>S</span>, command: "strikeThrough", title: "Gạch ngang" },
];

const blockButtons = [
  { label: "H1", value: "<h1>" },
  { label: "H2", value: "<h2>" },
  { label: "P", value: "<p>" },
];

const listButtons = [
  { icon: <i className="fas fa-list-ul" />, command: "insertUnorderedList", title: "Danh sách" },
  { icon: <i className="fas fa-list-ol" />, command: "insertOrderedList", title: "Danh sách số" },
];

export default function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung..." }) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      makeImagesResizable();
    }
  }, [value]);

  const emitChange = () => {
    if (!onChange || !editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const handleCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    emitChange();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleInlineImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleCommand("insertImage", reader.result);
      setTimeout(makeImagesResizable, 50); // đảm bảo ảnh có thể resize
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Thêm khả năng resize ảnh trong editor
  const makeImagesResizable = () => {
    const images = editorRef.current?.querySelectorAll("img");
    images?.forEach(img => {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.cursor = "nwse-resize";
      img.onmousedown = (e) => startResize(e, img);
    });
  };

  const startResize = (e, img) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = img.offsetWidth;
    const startHeight = img.offsetHeight;

    const doDrag = (event) => {
      const newWidth = startWidth + (event.clientX - startX);
      const newHeight = startHeight + (event.clientY - startY);
      img.style.width = newWidth + "px";
      img.style.height = newHeight + "px";
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
      emitChange(); // update nội dung editor
    };

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  return (
    <div className="rich-text-editor border rounded-3">
      {/* Toolbar */}
      <div className="editor-toolbar d-flex flex-wrap gap-2 p-2 border-bottom bg-light">
        {inlineButtons.map(btn => (
          <button key={btn.command} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand(btn.command)} title={btn.title}>{btn.icon}</button>
        ))}
        {listButtons.map(btn => (
          <button key={btn.command} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand(btn.command)} title={btn.title}>{btn.icon}</button>
        ))}
        {blockButtons.map(btn => (
          <button key={btn.label} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand("formatBlock", btn.value)}>{btn.label}</button>
        ))}
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand("justifyLeft")} title="Canh trái"><i className="fas fa-align-left"></i></button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand("justifyCenter")} title="Canh giữa"><i className="fas fa-align-center"></i></button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand("justifyRight")} title="Canh phải"><i className="fas fa-align-right"></i></button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleCommand("removeFormat")} title="Xóa định dạng"><i className="fas fa-eraser"></i></button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => imageInputRef.current?.click()} title="Chèn ảnh nhanh"><i className="fas fa-image"></i></button>
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleInlineImage} />
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        className="editor-content p-3"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        style={{ minHeight: "200px" }}
      ></div>
    </div>
  );
}
