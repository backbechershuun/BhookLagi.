import { Link } from "react-router-dom";
import RestaurantCard  from "./listing";
import RestaurantList from "./RestaurantListhome";
import TrustStrip from "../components/testinomial";
import Footer from "../components/footer";
import FeaturedRestaurants from "../components/featured";
import QuickFilters from "../components/Quickfilter";
import HowItWorks from "../components/Howitworks";
const Home = () => (
  <div>
    
   
 <section
  className="relative overflow-hidden w-full"
  style={{
    backgroundImage: "url('/images/Hero.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* Overlay so foreground content stays readable */}
  <div className="absolute inset-0 bg-white/50" />

  {/* Bottom shadow/fade for a premium transition into the next section */}
  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent" />
  <div className="absolute bottom-0 left-0 right-0 h-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)]" />

  {/* Content stays centered and constrained, same as before */}
  <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Left: text content */}
      <div className="text-center md:text-left">
        <h1 className="font-display text-5xl md:text-6xl text-stone-900 leading-tight">
          Book the perfect table,
          <br />
          <span className="text-brand-600">every time.</span>
        </h1>
        <p className="mt-6 text-lg text-stone-600 max-w-xl mx-auto md:mx-0">
          Find a restaurant, pick your exact table, and reserve it in seconds —
          no calls, no waiting.
        </p>
        <Link
          to="/restaurants"
          className="inline-block mt-8 rounded-full bg-brand-600 text-white px-8 py-3 font-medium hover:bg-brand-700 transition"
        >
          Reserve Now
        </Link>

          <div className="mt-12 flex flex-nowrap items-stretch justify-center md:justify-start divide-x divide-stone-200 overflow-x-auto md:overflow-visible">

              <div className="px-4 first:pl-0 sm:px-6">
                <p className="font-display text-2xl text-stone-900 whitespace-nowrap">Instant</p>
                <p className="mt-0.5 text-xs text-stone-500 whitespace-nowrap">Confirmed booking</p>
              </div>

              <div className="px-4 sm:px-6">
                <p className="font-display text-2xl text-stone-900 whitespace-nowrap">Live</p>
                <p className="mt-0.5 text-xs text-stone-500 whitespace-nowrap">Real-time tables</p>
              </div>

              <div className="px-4 sm:px-6">
                <p className="font-display text-2xl text-stone-900 whitespace-nowrap">Curated</p>
                <p className="mt-0.5 text-xs text-stone-500 whitespace-nowrap">Better dining</p>
              </div>

            </div>
      </div>
      

      {/* Right: image */}
      <div className="flex justify-center md:justify-end">
        <img
          src="/images/hero_visual.png"
          alt="A beautifully set restaurant table"
          className="rounded-3xl shadow-xl w-full max-w-md object-cover"
        />
      </div>
    </div>
  </div>
</section>
  
  {/* <RestaurantList/> */}
    
      <HowItWorks />
      <FeaturedRestaurants />
      <QuickFilters />
      <TrustStrip />
      <Footer />
  </div>
  
);


export default Home;
