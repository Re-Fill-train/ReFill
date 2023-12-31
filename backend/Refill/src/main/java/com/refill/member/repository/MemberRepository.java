package com.refill.member.repository;

import com.refill.member.entity.Member;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByLoginId(String loginId);
    Optional<Member> findByEmail(String email);
    Optional<Member> findByLoginIdAndEmail(String loginId, String email);
    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);

}
