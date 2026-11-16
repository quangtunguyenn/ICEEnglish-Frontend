import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useMarketingMotion() {
  const pageRef = useRef(null);

  useGSAP(() => {
    gsap.from("[data-page-hero] > *", {
      y: 28,
      opacity: 0,
      duration: 0.75,
      stagger: 0.15,
      ease: "power3.out",
    });

    gsap.to("[data-page-float]", {
      y: -10,
      duration: 2.8,
      delay: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.utils.toArray("[data-page-reveal]").forEach((element) => {
      gsap.from(element, {
        y: 32,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: element, start: "top 88%", once: true },
      });
    });
  }, { scope: pageRef });

  return pageRef;
}
