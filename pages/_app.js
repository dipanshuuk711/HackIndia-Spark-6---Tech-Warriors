import "../styles/globals.css";

//INTERNAL IMPORT
import { NavBar, Footer } from "../components/componentsindex";
import { NFTMarketplaceProvider } from "../Context/NFTMarketplaceContext";
import * as Sentry from '@sentry/react';  // For client-side
import { Integrations } from '@sentry/tracing';
import Hardhat from 'hardhat';


Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [new Integrations.BrowserTracing()],
});

const MyApp = ({ Component, pageProps }) => (
  <div>
    <NFTMarketplaceProvider>
    < NavBar />
    <Component {...pageProps} />
    <Footer />
    </NFTMarketplaceProvider>
  </div>
);

export default MyApp;
