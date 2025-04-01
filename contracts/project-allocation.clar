;; Project Allocation Contract
;; Tracks distribution of funds to specific initiatives

;; Define data variables
(define-map projects
  { project-id: uint }
  {
    name: (string-utf8 64),
    description: (string-utf8 256),
    active: bool,
    total-allocated: uint,
    total-spent: uint
  }
)
(define-data-var project-counter uint u0)
(define-map allocations
  { allocation-id: uint }
  {
    project-id: uint,
    amount: uint,
    timestamp: uint
  }
)
(define-data-var allocation-counter uint u0)

;; Define contract owner
(define-constant contract-owner tx-sender)

;; Authorization check
(define-private (is-contract-owner)
  (is-eq tx-sender contract-owner)
)

;; Public functions
(define-public (create-project (name (string-utf8 64)) (description (string-utf8 256)))
  (begin
    (asserts! (is-contract-owner) (err u403))
    (let
      (
        (project-id (var-get project-counter))
      )
      ;; Create new project
      (map-set projects
        { project-id: project-id }
        {
          name: name,
          description: description,
          active: true,
          total-allocated: u0,
          total-spent: u0
        }
      )

      ;; Increment project counter
      (var-set project-counter (+ project-id u1))

      ;; Return success with project ID
      (ok project-id)
    )
  )
)

(define-public (allocate-funds (project-id uint) (amount uint))
  (begin
    (asserts! (is-contract-owner) (err u403))
    (let
      (
        (project (unwrap! (map-get? projects { project-id: project-id }) (err u404)))
        (allocation-id (var-get allocation-counter))
        (new-total-allocated (+ (get total-allocated project) amount))
      )
      ;; Update project's total allocated
      (map-set projects
        { project-id: project-id }
        (merge project { total-allocated: new-total-allocated })
      )

      ;; Record allocation
      (map-set allocations
        { allocation-id: allocation-id }
        {
          project-id: project-id,
          amount: amount,
          timestamp: block-height
        }
      )

      ;; Increment allocation counter
      (var-set allocation-counter (+ allocation-id u1))

      ;; Return success with allocation ID
      (ok allocation-id)
    )
  )
)

;; Read-only functions
(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

(define-read-only (get-allocation (allocation-id uint))
  (map-get? allocations { allocation-id: allocation-id })
)

