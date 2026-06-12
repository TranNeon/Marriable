import React, { useState } from "react";
import "./Dropdown.css"; // Import your custom CSS styles

interface HoverSelectProps {
  items: { name: string | null; value: any }[] | undefined;
  action: (value: any) => void;
}

export default function HoverSelect({ items, action }: HoverSelectProps) {
  if (!items?.length) return <div> Loading </div>;

  // State trackers for visibility and selected value
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("Select an option");

  // Logic handlers for mouse behavior and click events
  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);

  const handleSelect = (item: { name: string | null; value: any }) => {
    setSelectedItemName("untitled");
    setIsOpen(false); // Hide menu upon selection
    action(item.value);
  };

  return (
    <div
      className="dropdown-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* The main trigger button showcasing current selection */}
      <button className="dropdown-trigger">
        {selectedItemName} <span className="arrow">▼</span>
      </button>

      {/* Conditionally render menu list only when wrapper is hovered */}
      {items?.length && isOpen && (
        <ul className="dropdown-menu">
          {items.map((item, index) => (
            <li
              key={index}
              className="dropdown-item"
              onClick={() => handleSelect(item)}
            >
              {item.name ?? "untitled"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
