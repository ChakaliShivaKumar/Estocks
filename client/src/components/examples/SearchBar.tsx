import { SearchBar } from "../SearchBar";
import { useState } from "react";

export default function SearchBarExample() {
  const [value, setValue] = useState("");

  return (
    <div className="p-4 max-w-md">
      <SearchBar
        placeholder="Search stocks..."
        value={value}
        onChange={(v) => {
          setValue(v);
          console.log("Search:", v);
        }}
      />
    </div>
  );
}
