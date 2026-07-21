import type { ReactElement } from "react";
import { useState } from "react";

type EventModalProps = {
  showAddEventModal: boolean;
  setShowAddEventModal: (show: boolean) => void;
};

export function EventModal({
  showAddEventModal,
  setShowAddEventModal,
}: EventModalProps): ReactElement | null {
  if (!showAddEventModal) return null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    console.log(title, description);
    setShowAddEventModal(false);
  };

  const handleCancel = () => {
    setShowAddEventModal(false);
  };

  return (
    <dialog open onClose={() => setShowAddEventModal(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-4">
        <h1>Add Event</h1>
        <form>
          <div>
            <label htmlFor="title">Title</label>
            <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" 
            value={description} onChange={(e) => setDescription(e.target.value)} 
            rows={4} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
        </form>
        <div className="flex justify-end">
        <button onClick={handleCancel}>Cancel</button>
        <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </dialog>
  );
};
