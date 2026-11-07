# Courier Guy and PUDO API research

The existing shipping adapter is server-side and must keep provider credentials in Manus secrets. The current checkout only collects a destination postal code, so the adapter must supply a complete collection address from `TCG_COLLECTION_ADDRESS_JSON` and a minimal delivery address with the destination code.

The official Courier Guy Locker API documentation describes `POST https://api-tcg.co.za/rates` with `collection_address`, `delivery_address`, and `parcels`. Parcel fields use `submitted_length_cm`, `submitted_width_cm`, `submitted_height_cm`, and `submitted_weight_kg`. The response returns a `rates` array whose price is in `rate` and whose service information is nested under `service_level`.

The official August 2025 Courier Guy Locker PDF documents the newer Shiplogic endpoints, including `https://api.shiplogic.com/rates`, pickup-point lookup at `/pickup-points?type=locker`, and locker provider fields such as `collection_pickup_point_provider` and `delivery_pickup_point_provider` set to `tcg-locker`. It also documents locker IDs and the same submitted parcel dimensions. Because the configured project secrets and existing code use the older `api-tcg.co.za` contract, the implementation keeps the endpoint configurable and uses the documented `api-tcg.co.za/rates` contract by default, while supporting a configured Shiplogic URL.

The existing adapter used non-documented `postal_code`, `terminal_id`, and `weight/length/width/height` parcel fields and did not parse the official `rate` or nested `service_level` response. Those mismatches explain why the live courier calls fall back to the configured flat-rate method.

Sources:

- The Courier Guy Locker API documentation: https://api-pudo.co.za/
- The Courier Guy Locker API PDF, August 2025: https://thecourierguy.co.za/wp-content/uploads/2025/08/The-Courier-Guy-Locker-API-docs.pdf
- The Courier Guy API documentation landing page: https://thecourierguy.co.za/api-docs/
