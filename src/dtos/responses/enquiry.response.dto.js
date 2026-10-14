class EnquiryResponseDTO {
  constructor(enquiry) {
    this.id = enquiry.id;
    this.name = enquiry.name;
    this.email = enquiry.email;
    this.phone = enquiry.phone;
    this.courseInterest = enquiry.course_interest || enquiry.courseInterest;
    this.status = enquiry.status;
    
    if (enquiry.claimed_by || enquiry.claimedBy) {
      if (typeof enquiry.claimed_by === 'object' || typeof enquiry.claimedBy === 'object') {
        const counselor = enquiry.claimed_by || enquiry.claimedBy;
        this.claimedBy = {
          id: counselor.id,
          name: counselor.name,
          email: counselor.email,
        };
      } else {
        this.claimedBy = {
          id: enquiry.claimed_by || enquiry.claimedBy,
          name: enquiry.counselor_name || null,
          email: enquiry.counselor_email || null,
        };
      }
    } else {
      this.claimedBy = null;
    }

    this.claimedAt = enquiry.claimed_at || enquiry.claimedAt || null;
    this.createdAt = enquiry.created_at || enquiry.createdAt;
    this.updatedAt = enquiry.updated_at || enquiry.updatedAt;
  }

  static fromEntity(enquiry) {
    if (!enquiry) return null;
    return new EnquiryResponseDTO(enquiry);
  }

  static fromEntities(enquiries = []) {
    return enquiries.map((item) => EnquiryResponseDTO.fromEntity(item));
  }
}

module.exports = EnquiryResponseDTO;
