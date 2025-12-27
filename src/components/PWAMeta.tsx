"use client";

import { useEffect } from 'react';

export function PWAMeta() {
  useEffect(() => {
    // Add PWA meta tags dynamically
    const addMetaTag = (name: string, content: string, attribute: string = 'name') => {
      if (document.querySelector(`meta[${attribute}="${name}"]`)) return;
      const meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    };

    const addLinkTag = (rel: string, href: string) => {
      if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.setAttribute('rel', rel);
      link.setAttribute('href', href);
      document.head.appendChild(link);
    };

    // Add manifest
    addLinkTag('manifest', '/manifest-doctor.json');
    
    // Add theme color
    addMetaTag('theme-color', '#017CA6');
    
    // Add Apple meta tags
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    addMetaTag('apple-mobile-web-app-title', 'Dr. Rajeev Portal');
    
    // Add Apple touch icon
    addLinkTag('apple-touch-icon', '/icons/icon-192.png');
  }, []);

  return null;
}

