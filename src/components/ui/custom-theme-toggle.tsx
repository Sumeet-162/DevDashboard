import { useTheme } from "@/hooks/use-theme"

const customToggleStyles = `
.theme-checkbox {
  --toggle-size: 10px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 4em;
  height: 2em;
  background: linear-gradient(to right, #efefef 50%, #2a2a2a 50%) no-repeat;
  background-size: 205%;
  background-position: 0;
  transition: 0.3s;
  border-radius: 99em;
  position: relative;
  cursor: pointer;
  font-size: var(--toggle-size);
  margin: 2px;
}

.theme-checkbox::before {
  content: "";
  width: 1.6em;
  height: 1.6em;
  position: absolute;
  top: 0.2em;
  left: 0.2em;
  background: linear-gradient(to right, #efefef 50%, #2a2a2a 50%) no-repeat;
  background-size: 205%;
  background-position: 100%;
  border-radius: 50%;
  transition: 0.3s;
}

.theme-checkbox:checked::before {
  left: calc(100% - 1.6em - 0.2em);
  background-position: 0;
}

.theme-checkbox:checked {
  background-position: 100%;
}
`;

export function CustomThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const handleToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <>
      <style>{customToggleStyles}</style>
      <input
        type="checkbox"
        className="theme-checkbox"
        checked={isDarkMode}
        onChange={handleToggle}
        aria-label="Toggle theme"
      />
    </>
  );
}
