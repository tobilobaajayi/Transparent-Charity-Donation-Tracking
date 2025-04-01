;; Expense Verification Contract
;; Validates how funds are being used

;; Define data variables
(define-map expenses
  { expense-id: uint }
  {
    project-id: uint,
    amount: uint,
    recipient: principal,
    description: (string-utf8 256),
    timestamp: uint,
    verified: bool
  }
)
(define-data-var expense-counter uint u0)
(define-map verifiers principal bool)

;; Define contract owner
(define-constant contract-owner tx-sender)

;; Authorization checks
(define-private (is-contract-owner)
  (is-eq tx-sender contract-owner)
)

(define-private (is-verifier)
  (default-to false (map-get? verifiers tx-sender))
)

;; Public functions
(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-contract-owner) (err u403))
    (map-set verifiers verifier true)
    (ok true)
  )
)

(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-contract-owner) (err u403))
    (map-delete verifiers verifier)
    (ok true)
  )
)

(define-public (record-expense (project-id uint) (amount uint) (recipient principal) (description (string-utf8 256)))
  (begin
    (asserts! (or (is-contract-owner) (is-verifier)) (err u403))
    (let
      (
        (expense-id (var-get expense-counter))
      )
      ;; Record expense
      (map-set expenses
        { expense-id: expense-id }
        {
          project-id: project-id,
          amount: amount,
          recipient: recipient,
          description: description,
          timestamp: block-height,
          verified: false
        }
      )

      ;; Increment expense counter
      (var-set expense-counter (+ expense-id u1))

      ;; Return success with expense ID
      (ok expense-id)
    )
  )
)

(define-public (verify-expense (expense-id uint))
  (begin
    (asserts! (is-verifier) (err u403))
    (let
      (
        (expense (unwrap! (map-get? expenses { expense-id: expense-id }) (err u404)))
      )
      ;; Update expense to verified
      (map-set expenses
        { expense-id: expense-id }
        (merge expense { verified: true })
      )

      ;; Return success
      (ok true)
    )
  )
)

;; Read-only functions
(define-read-only (get-expense (expense-id uint))
  (map-get? expenses { expense-id: expense-id })
)

(define-read-only (is-expense-verified (expense-id uint))
  (default-to false (get verified (map-get? expenses { expense-id: expense-id })))
)

