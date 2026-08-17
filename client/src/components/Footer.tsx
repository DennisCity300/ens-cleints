import React from "react";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-main">
        <span className="app-footer-brand">EnspireFX Websites</span>
        <span className="app-footer-tagline">Best Web Designer in Ghana</span>
      </div>
      <div className="app-footer-contact">
        <span>Accra: Soursop St GS-0750-8619, Iron City-Amanfrom, Ga South, Accra – Ghana</span>
        <span className="app-footer-sep">•</span>
        <span>Tema: DPS International School Road, Off Afao Road, Community 25, Tema, Ghana</span>
        <span className="app-footer-sep">•</span>
        <a href="tel:+233550919202">+233 55 091 9202</a>
        <span className="app-footer-sep">•</span>
        <a href="mailto:contact@enspirefx.com">contact@enspirefx.com</a>
      </div>
    </footer>
  );
}
