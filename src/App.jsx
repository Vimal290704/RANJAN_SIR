
import PhoneCallCard from "./pages/RanjanSirCallCard";
import Logo from "./assets/Logo.png";

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full">
        <div className="p-4">
          <img 
            src={Logo} 
            alt="Your Logo" 
            className="h-12 w-auto"
          />
        </div>
        <PhoneCallCard />
      </header>
    </div>
  );
}

export default App;