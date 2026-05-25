import Loader from "./Loader";

interface LuxuryLoaderProps {
  progress?: number;
  showProgress?: boolean;
}

export default function LuxuryLoader(_: LuxuryLoaderProps) {
  return <Loader />;
}
