;; Donation Management Contract
;; Records incoming contributions to the charity

;; Define data variables
(define-data-var total-donations uint u0)
(define-map donors principal uint)
(define-map donation-records
  { donor: principal, donation-id: uint }
  { amount: uint, timestamp: uint, note: (string-utf8 256) }
)
(define-data-var donation-counter uint u0)

;; Public functions
(define-public (donate (amount uint) (note (string-utf8 256)))
  (let
    (
      (donor tx-sender)
      (donation-id (var-get donation-counter))
      (current-donor-total (default-to u0 (map-get? donors donor)))
      (new-donor-total (+ current-donor-total amount))
    )
    ;; Update total donations
    (var-set total-donations (+ (var-get total-donations) amount))

    ;; Update donor's total
    (map-set donors donor new-donor-total)

    ;; Record donation details
    (map-set donation-records
      { donor: donor, donation-id: donation-id }
      {
        amount: amount,
        timestamp: block-height,
        note: note
      }
    )

    ;; Increment donation counter
    (var-set donation-counter (+ donation-id u1))

    ;; Return success with donation ID
    (ok donation-id)
  )
)

;; Read-only functions
(define-read-only (get-total-donations)
  (var-get total-donations)
)

(define-read-only (get-donor-total (donor principal))
  (default-to u0 (map-get? donors donor))
)

(define-read-only (get-donation-details (donor principal) (donation-id uint))
  (map-get? donation-records { donor: donor, donation-id: donation-id })
)

