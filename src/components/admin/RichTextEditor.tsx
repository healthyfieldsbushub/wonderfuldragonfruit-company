import { useRef, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Heading2, Heading3, Link2, List, ListOrdered, Quote, Code, Image as ImageIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  onInsertImage?: () => void;
}

export interface RichTextEditorHandle {
  focus: () => void;
  insertAtCursor: (text: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ value, onChange, rows = 12, placeholder, onInsertImage }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const wrap = (before: string, after = before) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = value.substring(start, end);
      const next = value.substring(0, start) + before + sel + after + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + before.length, end + before.length);
      });
    };

    const insertAtCursor = (text: string) => {
      const ta = textareaRef.current;
      const start = ta?.selectionStart ?? value.length;
      const end = ta?.selectionEnd ?? value.length;
      onChange(value.substring(0, start) + text + value.substring(end));
    };

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      insertAtCursor,
    }));

    const insertLine = (prefix: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      onChange(value.substring(0, lineStart) + prefix + value.substring(lineStart));
    };

    const insertLink = () => {
      const url = window.prompt('Link URL:');
      if (!url) return;
      wrap(`<a href="${url}" target="_blank" rel="noopener">`, '</a>');
    };

    const tools = [
      { icon: Bold, label: 'Bold', action: () => wrap('<strong>', '</strong>') },
      { icon: Italic, label: 'Italic', action: () => wrap('<em>', '</em>') },
      { icon: Heading2, label: 'Heading 2', action: () => insertLine('<h2>') },
      { icon: Heading3, label: 'Heading 3', action: () => insertLine('<h3>') },
      { icon: Link2, label: 'Link', action: insertLink },
      { icon: List, label: 'Bullet list', action: () => insertLine('<li>') },
      { icon: ListOrdered, label: 'Numbered list', action: () => insertLine('<li>') },
      { icon: Quote, label: 'Quote', action: () => wrap('<blockquote>', '</blockquote>') },
      { icon: Code, label: 'Inline code', action: () => wrap('<code>', '</code>') },
    ];

    return (
      <div className="border rounded-md overflow-hidden">
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1">
          {tools.map(({ icon: Icon, label, action }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={label}
              onClick={action}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          {onInsertImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert image"
              onClick={onInsertImage}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="border-0 rounded-none focus-visible:ring-0 font-mono text-sm"
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
