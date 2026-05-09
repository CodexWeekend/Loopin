'use client';

import React from 'react';
import { useMemo, useState } from 'react';

import { buildPlannerPreview, type PlannerPreview } from '../lib/get-trip-planner-view';

type TripPlannerShellProps = {
  initialPreview: PlannerPreview;
};

const sidebarItems = [
  { icon: '👜', label: 'Trips' },
  { icon: '🧭', label: 'Explore' },
  { icon: '🕘', label: 'Now' },
  { icon: '👥', label: 'Social' },
  { icon: '👤', label: 'Profile' },
] as const;

export function TripPlannerShell({ initialPreview }: TripPlannerShellProps) {
  const [budget, setBudget] = useState(initialPreview.trip.preferences.budget);
  const [selectedPlaceId, setSelectedPlaceId] = useState(initialPreview.selectedPlaceId);
  const [preview, setPreview] = useState(initialPreview);

  const selectedPlace = useMemo(
    () =>
      preview.itinerary.dayPlans
        .flatMap((dayPlan) => dayPlan.stops)
        .find((stop) => stop.placeId === selectedPlaceId) ?? preview.itinerary.dayPlans[0]?.stops[0],
    [preview, selectedPlaceId],
  );

  function handleGenerate() {
    const nextPreview = buildPlannerPreview({
      budget,
      citySlug: preview.trip.citySlug,
      interests: preview.trip.preferences.interests,
    });

    setPreview(nextPreview);
    setSelectedPlaceId(nextPreview.selectedPlaceId);
  }

  return (
    <div className="planner-page">
      <aside className="planner-sidebar">
        <div>
          <div className="brand">Loopin</div>
          <nav className="nav-list" aria-label="Primary">
            {sidebarItems.map((item, index) => (
              <div
                key={item.label}
                className={`nav-item${index === 0 ? ' nav-item--active' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-card">
          <div className="pill pill--success">✦ Find more hidden gems</div>
          <h3>Thoughtful spots most travelers miss.</h3>
          <p>Loopin surfaces neighborhood-aware suggestions with clear cost, time, and hiddenness context.</p>
          <button className="ghost-button">Learn more →</button>
        </div>
      </aside>

      <main className="planner-main">
        <header className="planner-topbar">
          <div className="planner-topbar__title">
            <strong>Tokyo Trip</strong>
            <span className="pill pill--success">✓ Saved</span>
          </div>

          <div className="planner-topbar__actions">
            <button className="planner-topbar__button">Share trip</button>
            <button className="planner-topbar__button">☼</button>
            <button className="planner-topbar__button">Avery ▾</button>
          </div>
        </header>

        <div className="planner-grid">
          <section className="left-rail">
            <div className="panel trip-summary">
              <div className="summary-image" aria-hidden="true" />

              <div className="summary-content">
                <div className="summary-copy">
                  <h1>Tokyo, Japan</h1>
                  <p>May 18 – May 22 • 4 days</p>

                  <div className="summary-meta">
                    <div>
                      <span>Party</span>
                      <strong>2 adults</strong>
                    </div>
                    <div>
                      <span>Budget</span>
                      <div className="pill pill--budget">${preview.trip.preferences.budget === 'medium' ? '120/day' : '90/day'}</div>
                    </div>
                    <div>
                      <span>Interests</span>
                      <strong>{preview.trip.preferences.interests.join(', ')}</strong>
                    </div>
                  </div>
                </div>

                <div className="summary-form">
                  <button className="primary-button" onClick={handleGenerate}>
                    Generate itinerary
                  </button>
                  <button className="ghost-button">Adjust preferences</button>

                  <label>
                    Budget
                    <select value={budget} onChange={(event) => setBudget(event.target.value as typeof budget)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {preview.itinerary.dayPlans.map((dayPlan) => (
              <article className="panel day-card" key={dayPlan.dayIndex}>
                <div className="day-card__header">
                  <div>
                    <h2>Day {dayPlan.dayIndex}</h2>
                    <p>{dayPlan.date}</p>
                  </div>
                  <div className="pill pill--budget">Est. cost ${dayPlan.estimatedCost}</div>
                </div>

                <div className="timeline-list">
                  {dayPlan.stops.map((stop) => (
                    <button
                      key={stop.placeId}
                      className="timeline-stop"
                      onClick={() => setSelectedPlaceId(stop.placeId)}
                      type="button"
                    >
                      <div className="timeline-stop__time">{stop.timeLabel}</div>
                      <div className="timeline-stop__thumb" aria-hidden="true" />
                      <div>
                        <div className="timeline-stop__title">
                          <span>{stop.placeName}</span>
                          {stop.badge ? (
                            <span
                              className={`pill ${stop.badge === 'Food & Drinks' ? 'pill--food' : 'pill--success'}`}
                            >
                              {stop.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="timeline-stop__description">{stop.description}</p>
                        <div className="timeline-stop__meta">
                          <span>↔ {stop.distanceKm} km</span>
                          <span>⌚ {stop.travelMinutesFromPrevious} min</span>
                          <span className="pill pill--budget">${stop.estimatedCost}</span>
                        </div>
                      </div>
                      <div className="timeline-stop__actions">
                        <span className="icon-button">⋯</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button className="ghost-button">＋ Add stop</button>
              </article>
            ))}
          </section>

          <aside className="right-rail">
            <div className="panel map-panel">
              <div className="map-stage">
                <div className="map-path" aria-hidden="true">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                      d="M8 12 C20 2, 28 28, 42 30 S58 48, 72 52 S84 76, 94 82"
                      fill="none"
                      stroke="#2c7d4b"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="map-marker marker-1" style={{ left: '32%', top: '16%' }}>
                  1
                </div>
                <div className="map-marker marker-2" style={{ left: '62%', top: '28%' }}>
                  2
                </div>
                <div className="map-marker marker-3" style={{ left: '48%', top: '49%' }}>
                  3
                </div>
                <div className="map-marker marker-4" style={{ left: '16%', top: '40%' }}>
                  4
                </div>
                <div className="map-marker marker-5" style={{ left: '74%', top: '69%' }}>
                  5
                </div>
              </div>
            </div>

            {selectedPlace ? (
              <div className="panel place-detail">
                <div className="pill pill--success">Hidden gem</div>
                <div className="place-detail__row">
                  <div className="place-detail__thumb" aria-hidden="true" />
                  <div>
                    <h3>{selectedPlace.placeName}</h3>
                    <p>{selectedPlace.description}</p>
                    <div className="tag-row">
                      <span className="tag">Culture</span>
                      <span className="tag">Nature</span>
                    </div>
                  </div>
                </div>
                <p className="panel-note">Open 6:00 – 18:00 • Free</p>
              </div>
            ) : null}

            <div className="panel swap-card">
              <h3>Smart swap suggestion</h3>
              <div className="swap-card__row">
                <div className="swap-card__thumb" aria-hidden="true" />
                <div>
                  <h3>{preview.smartSwap.label}</h3>
                  <p>{preview.smartSwap.reason}</p>
                  <p>
                    + {preview.smartSwap.walkDeltaMinutes} min walk • <span className="swap-price">Save ${preview.smartSwap.savedCost}</span>
                  </p>
                </div>
              </div>
              <div className="swap-actions">
                <button className="ghost-button">Keep original</button>
                <button className="primary-button">Swap it in</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
