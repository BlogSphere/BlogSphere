import { useEffect } from 'react';

export default function CollectionSEO({ title, description }) {
  useEffect(() => {
    const originalTitle = document.title;
    if (title) {
      document.title = `${title} | BlogSphere`;
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    let originalDescription = '';
    
    if (metaDescription) {
      originalDescription = metaDescription.getAttribute('content') || '';
      if (description) {
        metaDescription.setAttribute('content', description);
      }
    } else if (description) {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    return () => {
      document.title = originalTitle;
      if (metaDescription && originalDescription) {
        metaDescription.setAttribute('content', originalDescription);
      }
    };
  }, [title, description]);

  return null;
}
