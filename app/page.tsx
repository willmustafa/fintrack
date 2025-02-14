import HomeHeader from "@/components/home-header";
import HowItWorks from "@/components/how-it-works";
import Features from "@/components/features";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div
        className="container mx-auto max-w-7xl pt-16 px-6 flex-grow"
        id="home"
      >
        <HomeHeader />
        <HowItWorks />
        <Features />
      </div>
    </div>
  );
}
