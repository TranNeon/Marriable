import React, { useState } from "react";
import "./Dropdown.css";

interface HoverSelectProps {
  items: { name: string | null; value: any }[] | undefined;
  action: (value: any) => void;
}

export default function HoverSelect({ items, action }: HoverSelectProps) {
  if (!items?.length) return <div> Loading </div>;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("Select an option");

  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);

  const handleSelect = (item: { name: string | null; value: any }) => {
    setSelectedItemName(item.name ?? "untitled");
    setIsOpen(false); // Hide menu upon selection
    action(item.value);
  };

  return (
    <div
      className="dropdown-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="dropdown-trigger">
        {selectedItemName} <span className="arrow">▼</span>
      </button>

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
