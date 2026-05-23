import React from 'react';

export const ImageUploader = ({ images, imagePreviews, onImageDrop, handleImageFiles, removeImage }) => {
  return (
    <div 
      className="media-box"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onImageDrop}
    >
      <p>Imágenes del plato (Arrastra hasta 5 fotos)</p>
      <div className="preview-grid">
        {imagePreviews.map((src, idx) => (
          <div key={idx} className="preview-item">
            <img src={src} alt={`Preview ${idx}`} />
            <button type="button" className="remove-media" onClick={() => removeImage(idx)}>✕</button>
          </div>
        ))}
        {imagePreviews.length < 5 && (
          <label className="image-add-placeholder">
            <span>+</span>
            <input type="file" hidden multiple accept="image/*" onChange={(e) => handleImageFiles(e.target.files)} />
          </label>
        )}
      </div>
      <label className="btn btn-success upload-btn mt-2">
        Subir Imágenes
        <input type="file" hidden multiple accept="image/*" onChange={(e) => handleImageFiles(e.target.files)} />
      </label>
    </div>
  );
};

export const VideoUploader = ({ video, videoPreview, onVideoDrop, handleVideoFile }) => {
  return (
    <div 
      className="media-box"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onVideoDrop}
    >
      <p>Video de la receta (Opcional)</p>
      <div className="video-preview-box">
        {videoPreview ? (
          <video src={videoPreview} controls className="preview-video" />
        ) : (
          <div className="video-placeholder">🎬</div>
        )}
      </div>
      <label className="btn btn-success upload-btn mt-2">
        Seleccionar Video
        <input type="file" hidden accept="video/*" onChange={(e) => handleVideoFile(e.target.files[0])} />
      </label>
      {video && <p className="file-name">{video.name}</p>}
    </div>
  );
};
