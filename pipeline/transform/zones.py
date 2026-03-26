"""25-zone grid definition matching the schema's zone_grid table.

Horizontal: -1.25 to +1.25 ft (5 bands of 0.5 ft)
Vertical:    1.0  to  4.0  ft (5 bands of 0.6 ft)
zone_id = row * 5 + col + 1  (row 0 = bottom, col 0 = left from catcher's view)
"""

from pipeline.config import (
    ZONE_H_MIN,
    ZONE_H_MAX,
    ZONE_H_BANDS,
    ZONE_V_MIN,
    ZONE_V_MAX,
    ZONE_V_BANDS,
)

# Precomputed band widths
_H_BAND_WIDTH = (ZONE_H_MAX - ZONE_H_MIN) / ZONE_H_BANDS  # 0.5 ft
_V_BAND_WIDTH = (ZONE_V_MAX - ZONE_V_MIN) / ZONE_V_BANDS  # 0.6 ft

# Precompute all zone bounds for fast lookup: {zone_id: (x_min, x_max, z_min, z_max)}
_ZONE_BOUNDS: dict[int, tuple[float, float, float, float]] = {}
for _row in range(ZONE_V_BANDS):
    for _col in range(ZONE_H_BANDS):
        _zid = _row * ZONE_H_BANDS + _col + 1
        _x_min = ZONE_H_MIN + _col * _H_BAND_WIDTH
        _x_max = _x_min + _H_BAND_WIDTH
        _z_min = ZONE_V_MIN + _row * _V_BAND_WIDTH
        _z_max = _z_min + _V_BAND_WIDTH
        _ZONE_BOUNDS[_zid] = (
            round(_x_min, 4),
            round(_x_max, 4),
            round(_z_min, 4),
            round(_z_max, 4),
        )


def assign_zone(plate_x: float, plate_z: float) -> int:
    """Return the zone_id (1-25) for the given pitch location.

    Returns 0 if the pitch is outside the grid boundaries.
    """
    if plate_x is None or plate_z is None:
        return 0

    try:
        plate_x = float(plate_x)
        plate_z = float(plate_z)
    except (TypeError, ValueError):
        return 0

    if plate_x < ZONE_H_MIN or plate_x > ZONE_H_MAX:
        return 0
    if plate_z < ZONE_V_MIN or plate_z > ZONE_V_MAX:
        return 0

    # Column index (left to right from catcher's view)
    col = int((plate_x - ZONE_H_MIN) / _H_BAND_WIDTH)
    if col >= ZONE_H_BANDS:
        col = ZONE_H_BANDS - 1

    # Row index (bottom to top)
    row = int((plate_z - ZONE_V_MIN) / _V_BAND_WIDTH)
    if row >= ZONE_V_BANDS:
        row = ZONE_V_BANDS - 1

    return row * ZONE_H_BANDS + col + 1


def get_zone_bounds(zone_id: int) -> tuple[float, float, float, float]:
    """Return (x_min, x_max, z_min, z_max) for the given zone_id.

    Raises KeyError if zone_id is not in 1-25.
    """
    return _ZONE_BOUNDS[zone_id]
