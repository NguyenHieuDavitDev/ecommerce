import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function Carousel() {
  return (
    <div
      id="carouselExampleInterval"
      className="carousel slide"
      data-bs-ride="carousel"
    >
      <div className="carousel-inner">
        <div className="carousel-item active" data-bs-interval="10000">
          <img
            src="https://img.lazcdn.com/us/domino/f2ea2cb9-fdc2-4c23-a848-bdcdc1aa7be4_VN-1976-688.jpg_2200x2200q80.jpg_.avif"
            className="d-block w-100"
            alt="Slide 1"
          />
        </div>
        <div className="carousel-item" data-bs-interval="2000">
          <img
            src="https://img.lazcdn.com/us/domino/8a70a6e7-4790-4379-b09e-c219fd44f0d6_VN-1976-688.jpg_2200x2200q80.jpg_.avif"
            className="d-block w-100"
            alt="Slide 2"
          />
        </div>
        <div className="carousel-item">
          <img
            src="https://img.lazcdn.com/us/domino/dee296ab-f54f-4bc8-8484-83dba8d43087_VN-1976-688.jpg_2200x2200q80.jpg_.avif"
            className="d-block w-100"
            alt="Slide 3"
          />
        </div>
      </div>

      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleInterval"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>

      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleInterval"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}
