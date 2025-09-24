import { useState } from 'react';

export default function PRWritingAssistant() {
  const [draft, setDraft] = useState('');

  const mockDraft = `For Immediate Release

[City, State] – [Date] – [Company Name] announces...

[Body of the press release]

For more information, contact...

###`;

  const generateDraft = () => {
    setDraft(mockDraft);
  };

  return (
    <div>
      <h1>PR Writing Assistant</h1>
      <button onClick={generateDraft}>Generate Draft</button>
      <textarea value={draft} onChange={e => setDraft(e.target.value)} rows="20" cols="80" />
    </div>
  );
}