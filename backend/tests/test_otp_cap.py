import pytest
from fastapi import HTTPException
from app.routers.itr import check_and_increment_user_otp, reset_user_otp_count_for_testing, MAX_DAILY_OTP_PER_USER


def test_user_otp_cap_enforced():
    reset_user_otp_count_for_testing()
    test_user_id = 999
    
    # 5 attempts should succeed
    for i in range(MAX_DAILY_OTP_PER_USER):
        check_and_increment_user_otp(test_user_id)
        
    # 6th attempt should raise 429
    with pytest.raises(HTTPException) as exc:
        check_and_increment_user_otp(test_user_id)
    assert exc.value.status_code == 429
    assert "Daily OTP request limit reached" in exc.value.detail
