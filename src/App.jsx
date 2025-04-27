import PhoneCallCard from "./pages/RanjanSirCallCard";
import Logo from "./assets/Logo.png";

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full">
        <div className="p-4 flex items-center">
          <img src={Logo} alt="Your Logo" className="h-12 w-auto mr-4" />
          <div className="font-bold text-lg text-white">
            Made with <span className="text-red-500">❤️</span> by BRICKS
          </div>
        </div>
        <PhoneCallCard />
        <elevenlabs-convai agent-id="7kEIi95RiFRHLSPKXCGU"></elevenlabs-convai>
        <script
          src="https://elevenlabs.io/convai-widget/index.js"
          async
          type="text/javascript"
        ></script>
      </header>

      <footer className="text-center py-1 bg-gray-100">
        <div className="font-medium text-lg tracking-wide text-gray-700">
          By Gurukulites for Gurukulites
        </div>
      </footer>
    </div>
  );
}

export default App;
