import sareeLoaderFilled from "@/assets/loaders/saree-loader-filled.png";
import sareeLoaderOutline from "@/assets/loaders/saree-loader-outline.png";

export default function Loader() {
  return (
    <div className="kala-loader-screen" role="status" aria-label="Loading">
      <span className="sr-only">Loading</span>

      <div className="kala-loader-figure" aria-hidden="true">
        <img
          src={sareeLoaderOutline}
          alt=""
          className="kala-loader-frame kala-loader-outline"
          draggable={false}
        />
        <img
          src={sareeLoaderFilled}
          alt=""
          className="kala-loader-frame kala-loader-filled"
          draggable={false}
        />
      </div>
    </div>
  );
}
