import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_PHOTOS } from '../data/photoDumpData';
import { GooglePhotosIcon } from './Icons';
import {
  X, Maximize2, ZoomIn, ZoomOut, RotateCcw,
  ChevronLeft, ChevronRight, Upload, Heart, Camera
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function PhotoDumpModal({ isOpen, onClose }) {
  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('jm_photo_dump_uploads');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...INITIAL_PHOTOS];
      }
    } catch {
      // fallback
    }
    return INITIAL_PHOTOS;
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null); // index in current filtered list
  const [zoomLevel, setZoomLevel] = useState(1);
  const [likedPhotoIds, setLikedPhotoIds] = useState(() => {
    try {
      const saved = localStorage.getItem('jm_photo_dump_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoTitleInput, setPhotoTitleInput] = useState('');
  const fileInputRef = useRef(null);

  // Filtered photos
  const filteredPhotos = photos.filter((p) => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.caption.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.camera.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const filteredCount = filteredPhotos.length;

  const handleNextPhoto = useCallback(() => {
    sound.playTick();
    setZoomLevel(1);
    setLightboxIndex((prev) => (prev !== null && filteredCount > 0 ? (prev + 1) % filteredCount : null));
  }, [filteredCount]);

  const handlePrevPhoto = useCallback(() => {
    sound.playTick();
    setZoomLevel(1);
    setLightboxIndex((prev) => (prev !== null && filteredCount > 0 ? (prev - 1 + filteredCount) % filteredCount : null));
  }, [filteredCount]);

  // Keyboard shortcut listener (Esc to close lightbox or modal, arrow keys for navigation)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
          setZoomLevel(1);
          sound.playClick();
        } else {
          onClose();
          sound.playClick();
        }
      } else if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight') {
          handleNextPhoto();
        } else if (e.key === 'ArrowLeft') {
          handlePrevPhoto();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxIndex, onClose, handleNextPhoto, handlePrevPhoto]);

  // Categories
  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'nairobi', label: 'Nairobi & Streets' },
    { id: 'workspace', label: 'Workspace & Labs' },
    { id: 'hackathons', label: 'Hackathons & Tech' },
    { id: 'nature', label: 'Moments & Nature' }
  ];

  // Handle Photo Upload from local files
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    sound.playSuccess();
    const newUploads = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newPhoto = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          caption: 'User added snapshot to personal photo dump archive.',
          location: 'Nairobi, Kenya',
          date: 'Recent Capture',
          category: activeCategory === 'all' ? 'workspace' : activeCategory,
          camera: 'Authentic Capture',
          url: uploadEvent.target.result,
          aspect: 'landscape',
          isUserUpload: true
        };

        newUploads.push(newPhoto);

        if (newUploads.length === files.length) {
          setPhotos((prev) => {
            const updated = [...newUploads, ...prev];
            try {
              const currentSaved = JSON.parse(localStorage.getItem('jm_photo_dump_uploads') || '[]');
              localStorage.setItem('jm_photo_dump_uploads', JSON.stringify([...newUploads, ...currentSaved]));
            } catch {
              // localstorage size limits
            }
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle adding photo via direct URL
  const handleAddPhotoUrl = (e) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;

    sound.playSuccess();
    const newPhoto = {
      id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: photoTitleInput.trim() || 'Visual Capture',
      caption: 'Direct photography asset added to personal photo dump.',
      location: 'Nairobi, Kenya',
      date: 'Recent Capture',
      category: activeCategory === 'all' ? 'workspace' : activeCategory,
      camera: 'Authentic Shot',
      url: photoUrlInput.trim(),
      aspect: 'landscape',
      isUserUpload: true
    };

    setPhotos((prev) => {
      const updated = [newPhoto, ...prev];
      try {
        const currentSaved = JSON.parse(localStorage.getItem('jm_photo_dump_uploads') || '[]');
        localStorage.setItem('jm_photo_dump_uploads', JSON.stringify([newPhoto, ...currentSaved]));
      } catch {
        // storage fallback
      }
      return updated;
    });

    setPhotoUrlInput('');
    setPhotoTitleInput('');
  };

  // Toggle Like on photo
  const toggleLike = (photoId, e) => {
    e.stopPropagation();
    sound.playTick();
    setLikedPhotoIds((prev) => {
      const next = { ...prev, [photoId]: !prev[photoId] };
      try {
        localStorage.setItem('jm_photo_dump_likes', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Lightbox navigation
  const handleOpenPhoto = (index) => {
    sound.playClick();
    setZoomLevel(1);
    setLightboxIndex(index);
  };

  if (!isOpen) return null;

  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="photo-dump-overlay" onClick={onClose}>
      <div className="photo-dump-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pd-modal-header">
          <div className="pd-header-left">
            <div className="pd-icon-badge">
              <GooglePhotosIcon size={24} className="pd-pinwheel-spin" />
            </div>
            <div className="pd-title-group">
              <div className="pd-title-row">
                <h3 className="pd-title">Photo Dump</h3>
                <span className="pd-count-pill mono">{photos.length} Snapshots</span>
              </div>
              <p className="pd-subtitle">
                Visual archive & moments by John Mokaya — Nairobi urban life, hackathons, and developer setups.
              </p>
            </div>
          </div>

          <div className="pd-header-actions">
            {/* Hidden File Input for Custom Uploads */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="pd-upload-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Add photos to your dump"
            >
              <Upload size={13} />
              <span>Add Photos</span>
            </button>

            <button
              type="button"
              className="pd-close-btn"
              onClick={onClose}
              aria-label="Close Photo Dump"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar: Category Filters & Search */}
        <div className="pd-toolbar">
          <div className="pd-categories-track">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pd-filter-pill mono ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => {
                  sound.playTick();
                  setActiveCategory(cat.id);
                }}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="pd-search-box">
            <input
              type="text"
              placeholder="Search snapshots, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pd-search-input mono"
            />
          </div>
        </div>

        {/* Masonry / Adaptive Photo Grid */}
        <div className="pd-grid-viewport">
          {photos.length === 0 ? (
            <div className="pd-zero-state">
              <div className="pd-zero-icon-wrapper">
                <GooglePhotosIcon size={52} className="pd-zero-pinwheel" />
              </div>
              <h3 className="pd-zero-title">Ready for Your Photos</h3>
              <p className="pd-zero-desc">
                No dummy or stock photos loaded. This gallery is ready for your authentic photography captures.
              </p>

              <div className="pd-zero-actions">
                <button
                  type="button"
                  className="pd-upload-hero-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <Upload size={16} />
                  <span>Upload Photos from Device</span>
                </button>
              </div>

              <div className="pd-zero-url-box">
                <span className="pd-zero-divider-text mono">OR ADD VIA IMAGE LINK</span>
                <form onSubmit={handleAddPhotoUrl} className="pd-zero-url-form">
                  <input
                    type="url"
                    placeholder="https://example.com/your-photo.jpg"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    className="pd-zero-input mono"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Photo Title"
                    value={photoTitleInput}
                    onChange={(e) => setPhotoTitleInput(e.target.value)}
                    className="pd-zero-input-title mono"
                  />
                  <button type="submit" className="pd-zero-submit-btn mono">
                    Add Photo
                  </button>
                </form>
              </div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="pd-empty-state">
              <Camera size={32} className="pd-empty-icon" />
              <h4>No snapshots matched your filter</h4>
              <p>Try clearing your search query or switching categories.</p>
            </div>
          ) : (
            <div className="pd-masonry-grid">
              {filteredPhotos.map((photo, index) => {
                const isLiked = !!likedPhotoIds[photo.id];
                return (
                  <article
                    key={photo.id}
                    className="pd-photo-card"
                    onClick={() => handleOpenPhoto(index)}
                  >
                    <div className="pd-img-wrapper">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="pd-thumbnail"
                        loading="lazy"
                      />
                      <div className="pd-card-overlay">
                        <span className="pd-zoom-hint mono">
                          <Maximize2 size={12} />
                          <span>Inspect</span>
                        </span>

                        <button
                          type="button"
                          className={`pd-like-btn ${isLiked ? 'liked' : ''}`}
                          onClick={(e) => toggleLike(photo.id, e)}
                          title="Favorite this capture"
                        >
                          <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#fff'} />
                        </button>
                      </div>
                    </div>

                    <div className="pd-card-meta">
                      <div className="pd-card-top-row">
                        <h4 className="pd-photo-title">{photo.title}</h4>
                        <span className="pd-location-tag mono">{photo.location.split('·')[0].trim()}</span>
                      </div>
                      <p className="pd-photo-caption">{photo.caption}</p>
                      <div className="pd-card-specs-row mono">
                        <span className="pd-camera-spec">{photo.camera}</span>
                        <span className="pd-date-spec">{photo.date}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Fullscreen Photo Lightbox Modal */}
        {currentLightboxPhoto && (
          <div className="pd-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
            <div className="pd-lightbox-container" onClick={(e) => e.stopPropagation()}>
              {/* Lightbox Header Bar */}
              <div className="pdl-header">
                <div className="pdl-left">
                  <span className="pdl-index mono">
                    {lightboxIndex + 1} / {filteredPhotos.length}
                  </span>
                  <h4 className="pdl-title">{currentLightboxPhoto.title}</h4>
                  <span className="pdl-loc mono">{currentLightboxPhoto.location}</span>
                </div>

                <div className="pdl-right">
                  {/* Zoom controls */}
                  <div className="pdl-zoom-tools mono">
                    <button
                      type="button"
                      className="pdl-tool-btn"
                      onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="pdl-zoom-val">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      className="pdl-tool-btn"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      type="button"
                      className="pdl-tool-btn"
                      onClick={() => setZoomLevel(1)}
                      title="Reset Zoom"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="pdl-close-btn"
                    onClick={() => setLightboxIndex(null)}
                    aria-label="Close Lightbox"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Image Viewport with Next/Prev arrows */}
              <div className="pdl-viewport">
                <button
                  type="button"
                  className="pdl-nav-btn prev"
                  onClick={handlePrevPhoto}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="pdl-image-stage">
                  <img
                    src={currentLightboxPhoto.url}
                    alt={currentLightboxPhoto.title}
                    className="pdl-full-img"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                </div>

                <button
                  type="button"
                  className="pdl-nav-btn next"
                  onClick={handleNextPhoto}
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Lightbox Footer Bar */}
              <div className="pdl-footer">
                <div className="pdl-caption-box">
                  <p className="pdl-caption">{currentLightboxPhoto.caption}</p>
                </div>
                <div className="pdl-specs-meta mono">
                  <span className="pdl-spec-item">{currentLightboxPhoto.camera}</span>
                  <span className="pdl-spec-divider">•</span>
                  <span className="pdl-spec-item">{currentLightboxPhoto.date}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Floating Photo Dump Trigger Button (Bottom Right)
 * Positioned on the right side and at the bottom with the authentic
 * Google Photos pinwheel icon, tactile audio feedback, and high craft.
 */
export function FloatingPhotoDumpButton({ onClick }) {
  const [count, setCount] = useState(() => {
    try {
      const saved = localStorage.getItem('jm_photo_dump_uploads');
      const countSaved = saved ? JSON.parse(saved).length : 0;
      return INITIAL_PHOTOS.length + countSaved;
    } catch {
      return INITIAL_PHOTOS.length;
    }
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('jm_photo_dump_uploads');
        const countSaved = saved ? JSON.parse(saved).length : 0;
        setCount(INITIAL_PHOTOS.length + countSaved);
      } catch {
        setCount(INITIAL_PHOTOS.length);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  return (
    <div className="floating-photo-dump-widget">
      <button
        type="button"
        className="floating-photo-dump-btn"
        onClick={() => {
          sound.playClick();
          onClick();
        }}
        title="Open Photo Dump • Photography Archive"
        aria-label="Open Photo Dump"
      >
        <span className="fpd-icon-box">
          <GooglePhotosIcon size={26} className="fpd-pinwheel" />
        </span>
        <span className="fpd-label">Photo Dump</span>
        <span className="fpd-count mono">({count})</span>
      </button>
    </div>
  );
}
