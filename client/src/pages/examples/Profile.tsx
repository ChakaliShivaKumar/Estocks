import Profile from "../Profile";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function ProfileExample() {
  return (
    <ThemeProvider>
      <Profile />
    </ThemeProvider>
  );
}
