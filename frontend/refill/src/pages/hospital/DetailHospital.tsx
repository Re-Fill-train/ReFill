import React, { useEffect, useState } from "react";
import axios, { AxiosHeaders } from "axios";
import Navbar from "../../components/Navbar";
import Footer from "components/Footer";
import Cloud2 from "../../assets/cloud.png";
import styled from "@emotion/styled";
import Button from "../../components/elements/Button";
import Arrow from "../../assets/reservation_arrow_icon.png";
import { Rating, Pagination, Stack, Grid } from "@mui/material";
import Container from "@mui/material/Container";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import { red } from "@mui/material/colors";
import { RootState } from "store/reducers";
import { useSelector } from "react-redux";
import HosInfo from "components/hospital/HosInfo";
import RegisterDoctor from "./RegisterDoctor";
import AddIcon from "@mui/icons-material/Add";
import ModifyDoctor from "./ModifyDoctor";
import DeleteDoctor from "./DeleteDoctor";
import SelectDoctorAndTime from "components/consultReservation/SelectDoctorAndTime";
import DetailReservation from "components/detailReservation/DetailReservation";
import { useParams } from "react-router-dom";
// import StarRatings from "react-star-ratings";

interface DivProps {
  buttonData?: number;
}

interface Doctor {
  doctorId: number;
  name: string;
  profileImg: string;
  licenseNumber: string;
  licenseImg: string;
  description: string;
  majorAreas: string[];
  educationBackgrounds: string[];
}

interface Review {
  reviewId: number;
  score: number;
  content: string;
  memberId: number;
  nickname: string;
  doctorId: number;
  doctorName: string;
  hospitalId: number;
  hospitalName: string;
  updateDate: string;
}

interface Time {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface InputImageState {
  bannerImg: File | null;
}

const Containers = styled.div`
  border 0;
  min-width: 100%;
  min-height: 50vh;
  align-items: center;
  display:flex;
  justify-content: center;
  flex-direction: column;
  margin : 50px 0px;
`;

const BannerContainer = styled.div`
  position: relative;
  height: 280px;
`;

const Bannerimg = styled.img`
  width: 100%;
  height: 150px;
`;

const Profileimg = styled.img`
  position: absolute;
  width: 200px;
  height: 200px;
  top: 80px;
  margin-left: 150px;
  border-radius: 40px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px black solid;
`;

const Kakaomap = styled.div`
  display: flex;
  justify-content: center;
  height: 500px;
  border: 1px black solid;
`;
const Layout = styled.div`
  display: flex;
  justify-content: space-between;
  width: 1300px;
`;
const ButtonList = styled.div`
  display: flex;
  justify-content: space-between;
  width: 400px;
  height: 60px;
`;

const HospitalInfo = styled.div`
  display: flex;
  flex-direction: column;
  display: ${(props: DivProps) => (props.buttonData === 0 ? "block" : "none")};
`;

const DoctorInfo = styled.div`
  display: flex;
  flex-direction: column;
  display: ${(props: DivProps) => (props.buttonData === 1 ? "block" : "none")};
`;

const Review = styled.div`
  display: flex;
  flex-direction: column;
  display: ${(props: DivProps) => (props.buttonData === 2 ? "block" : "none")};
`;

const Doctors = styled.div`
  display: flex;
  justify-content: space-around;
  background-color: #d8eeff;
  width: 650px;
  height: 355px;
  border-radius: 30px;
  box-shadow: 4px 4px 5px rgba(0, 0, 0, 0.3);
  margin-top: 30px;
  margin-bottom: 100px;
`;
const Doctor_common = styled.div`
  display: flex;
  flex-direction: column;
`;

const Bigspan = styled.span`
  font-weight: bold;
  font-size: 25px;
  margin-top: 8px;
  color: #2e5077;
`;

const Doctor_res_icon = styled.span`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 320px;
`;

const DetailHospital: React.FC = () => {
  const { hospitalId } = useParams();

  // 배너이미지 갈아끼울때마다 적용
  const [hospitalName, setHospitalName] = useState("");
  const [doctorData, setDoctorData] = useState<Doctor[]>([]);
  const [reviewData, setReviewData] = useState<Review[]>([]);
  const [timeData, setTimeData] = useState<Time[]>([]);
  const [hospitalData, setHospitalData] = useState({
    hospitalId: 0,
    name: "",
    longitude: 0,
    latitude: 0,
    hospitalProfileImg: "",
    bannerProfileImg: "",
    address: "",
    tel: "",
    score: 0,
    email: "",
    operatingHourResponses: [],
  });

  // 버튼누르는거에 따른 상태값
  const [buttonData, setButtonData] = useState(0);

  const handleHospitalClick = () => {
    setButtonData(0);
  };

  const handleDoctorClick = () => {
    setButtonData(1);
  };

  const handleReviewClick = () => {
    setButtonData(2);
  };

  // 페이지네이션
  const [page, setPage] = useState(1);
  const reviewPerPage = 3;

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 리뷰 최신순, 평점높은순, 낮은순 state값으로 반영
  const [state, setState] = useState<number>(0);
  const stateChange = (event: SelectChangeEvent<number>) => {
    setState(event.target.value as number);
  };

  // 의사에 따른 리뷰 데이터 반영
  const [dreview, setDreview] = useState<number>(0);
  const dreviewChange = (event: SelectChangeEvent<number>) => {
    setDreview(event.target.value as number);
  };

  // doctorId값 추출
  const doctorIds: { doctorId: number; doctorName: string }[] = [];

  reviewData.forEach((response) => {
    const { doctorId, doctorName } = response;
    const existingDoctor = doctorIds.find((item) => item.doctorId === doctorId);

    if (!existingDoctor) {
      doctorIds.push({ doctorId, doctorName });
    }
  });

  // 평점 높은순 나열 알고리즘
  const reviewFirst = () => {
    return reviewData
      .slice()
      .sort((a: Review, b: Review) => (b.score || 0) - (a.score || 0));
  };

  // 평점 낮은순 나열 알고리즘
  const reviewLast = () => {
    return reviewData
      .slice()
      .sort((a: Review, b: Review) => (a.score || 0) - (b.score || 0));
  };

  // 리뷰 최신순 알고리즘
  const reviewLatest = () => {
    return reviewData.slice().sort((a: Review, b: Review) => {
      const dateA = new Date(a.updateDate);
      const dateB = new Date(b.updateDate);

      const differenceInMillis: number = dateA.getTime() - dateB.getTime();

      return differenceInMillis;
    });
  };

  // 의사Id와 리뷰 알고리즘에 대한 리뷰 리턴
  const getFilteredReviewData = () => {
    let filteredData = [...reviewData];

    // state에 따라 리뷰 정보 재구성
    if (state === 0) {
      filteredData = reviewFirst();
    } else if (state === 1) {
      filteredData = reviewLast();
    } else if (state === 2) {
      filteredData = reviewLatest();
    }

    // dreview 값에 따라 리뷰 정보를 필터링
    if (dreview !== 0) {
      filteredData = filteredData.filter(
        (review) => review.doctorId === dreview,
      );
    }

    return filteredData;
  };

  const filteredReviewData = getFilteredReviewData();
  const token = useSelector((state: RootState) => state.login.token);
  const ishospital = useSelector((state: RootState) => state.login.ishospital);

  // 의사 등록 모달 오픈
  const [registerOpen, setRegisterOpen] = useState(false);
  const handleRMOpen = () => {
    setRegisterOpen(true);
  };
  const handleRMClose = () => {
    setRegisterOpen(false);
  };

  const RegistDoc = async (hospitalid: number, formData: any) => {
    console.log(formData);
    axios
      .post(`api/v1/hospital/${hospitalid}/doctor`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      .then((response) => {
        console.log(response);
        console.log(1);
        setRegisterOpen(false);
      })

      .catch((error) => {
        console.log(1);
        handleRMClose();
      });
  };

  // 의사 수정

  const [modifyOpen, setModifyOpen] = useState(false);
  const handleMMOpen = () => {
    setModifyOpen(true);
  };
  const handleMMClose = () => {
    setModifyOpen(false);
  };

  const ModifyDoc = async (
    hospitalid: number,
    doctorid: number,
    formData: any,
  ) => {
    console.log(formData);
    axios
      .put(`api/v1/hospital/${hospitalid}/doctor/${doctorid}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      .then((response) => {
        console.log(response);
        setModifyOpen(false);
      })

      .catch((error) => {
        console.log(1);
        handleMMClose();
      });
  };

  // 의사 삭제
  const [deleteOpen, setDeleteOpen] = useState(false);
  const handleDMOpen = () => {
    setDeleteOpen(true);
  };
  const handleDMClose = () => {
    setDeleteOpen(false);
  };

  const DeleteDoc = async (doctorid: number) => {
    axios
      .delete(`api/v1/hospital/${hospitalId}/doctor/${doctorid}`, {
        headers: {
          // "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      .then((response) => {
        console.log(response);
        setDeleteOpen(false);
      })

      .catch((error) => {
        console.log(1);
        handleDMClose();
      });
  };

  const [mypage, setMypage] = useState(false);
  const MyId: number = useSelector((state: RootState) => state.login.hosid);

  useEffect(() => {
    if (ishospital === true) {
      if (MyId === hospitalData.hospitalId) {
        setMypage(true);
      }
    }
    axios
      .get(`/api/v1/hospital/${hospitalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      .then((response) => {
        const {
          hospitalResponse,
          doctorResponses,
          reviewResponses,
          operatingHourResponses,
        } = response.data;

        console.log(response.data);
        setHospitalData(hospitalResponse);
        setDoctorData(doctorResponses);
        setReviewData(reviewResponses);
        setHospitalName(hospitalResponse.name);
        setTimeData(operatingHourResponses);
      })

      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    console.log(hospitalData);
    console.log(doctorData);
    console.log(reviewData);
    console.log(timeData);
  }, [hospitalData, doctorData, reviewData, timeData]);

  // image onclick 이벤트 => 배너이미지 변경
  const [inputImage, setInputImage] = useState<InputImageState>({
    bannerImg: null,
  });

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null; // 선택한 파일을 가져옵니다. 없으면 null로 설정합니다.

    setInputImage((prevInputImage) => ({
      ...prevInputImage,
      [e.target.name]: file,
    }));
    if (file) {
      if (e.target.name === "bannerImg") {
        (document.getElementById("bannerImg") as HTMLInputElement).value =
          file.name;
      }
    }
  };

  return (
    <div>
      <Navbar />
      {/* 배너이미지 변경해주는거 적용해야함 */}
      <BannerContainer>
        <Bannerimg
          src={
            hospitalData.bannerProfileImg
              ? hospitalData.bannerProfileImg
              : Cloud2
          }
        />

        <Profileimg src={hospitalData.hospitalProfileImg} />
      </BannerContainer>
      <Containers>
        <Layout>
          <Content style={{ width: "850px" }}>
            <span className="text-2xl font-bold">{hospitalData.name}</span>
            <Kakaomap></Kakaomap>
            <ButtonList>
              <Button
                content="병원 정보"
                variant={
                  buttonData === 0 ? "detailSelected" : "detailUnselected"
                }
                width="100px"
                onClick={handleHospitalClick}
                customStyles={{
                  boxShadow: "none",
                  height: "60px",
                }}
              />
              <Button
                content="의사 정보"
                variant={
                  buttonData === 1 ? "detailSelected" : "detailUnselected"
                }
                width="100px"
                customStyles={{
                  boxShadow: "none",
                  height: "60px",
                }}
                onClick={handleDoctorClick}
              />
              <Button
                content="리뷰"
                variant={
                  buttonData === 2 ? "detailSelected" : "detailUnselected"
                }
                width="100px"
                customStyles={{
                  boxShadow: "none",
                  height: "60px",
                }}
                onClick={handleReviewClick}
              />
            </ButtonList>
            <hr style={{ border: "0.1rem solid #888888" }} />
            <HospitalInfo buttonData={buttonData}>
              <h1 className="text-4xl font-bold pb-6">병원 정보</h1>
              <HosInfo
                timeData={timeData}
                address={hospitalData.address}
                tel={hospitalData.tel}
                email={hospitalData.email}
              />
            </HospitalInfo>
            <DoctorInfo buttonData={buttonData}>
              <h1 className="text-4xl font-bold">의사 정보</h1>
              <div>
                {doctorData.map((doctor, index) => (
                  <div key={index} className="flex justify-around items-center">
                    <Doctors>
                      <Doctor_common
                        className=" items-center"
                        style={{ width: "150px" }}
                      >
                        <img
                          src={doctor.profileImg}
                          alt={doctor.name}
                          className="w-28 h-28 rounded-full mt-10"
                        />
                        <span className="mt-5 text-3xl font-medium">
                          {doctor.name}
                        </span>
                      </Doctor_common>

                      <Doctor_common
                        className="justify-center"
                        style={{ width: "400px" }}
                      >
                        <div className="flex justify-between">
                          <Bigspan>약력</Bigspan>
                          <div className="flex">
                            <ModifyDoctor
                              open={modifyOpen}
                              handleMOpen={handleMMOpen}
                              handleMClose={handleMMClose}
                              description={doctor.description}
                              education={doctor.educationBackgrounds}
                              major={doctor.majorAreas}
                              profile={doctor.profileImg}
                              hospitalname={hospitalData.name}
                              onModify={(formData) =>
                                ModifyDoc(
                                  hospitalData.hospitalId,
                                  doctor.doctorId,
                                  formData,
                                )
                              }
                            ></ModifyDoctor>
                            <DeleteDoctor
                              open={deleteOpen}
                              handleMOpen={handleDMOpen}
                              handleMClose={handleDMClose}
                              hospitalname={hospitalData.name}
                              doctorname={doctor.name}
                              onDeleteDoctor={() => DeleteDoc(doctor.doctorId)}
                            ></DeleteDoctor>
                          </div>
                        </div>
                        <p className="text-lg">{doctor.description}</p>
                        <Bigspan>주요 분야</Bigspan>
                        <ul>
                          {doctor.majorAreas.map((area, index) => (
                            <li className="text-lg" key={index}>
                              {area}
                            </li>
                          ))}
                        </ul>
                        <Bigspan>학력</Bigspan>
                        <ul>
                          {doctor.educationBackgrounds.map(
                            (background, index) => (
                              <li className="text-lg" key={index}>
                                {background}
                              </li>
                            ),
                          )}
                        </ul>
                      </Doctor_common>
                    </Doctors>
                    <Doctor_res_icon>
                      <img src={Arrow} alt="" />
                      <a href="" className="mt-4 text-xl">
                        {mypage ? "내 상담 확인하기" : "상담 예약 하기"}
                      </a>
                    </Doctor_res_icon>
                  </div>
                ))}
                {mypage && doctorData.length < 3 && (
                  <div className="flex items-center justify-center flex-col">
                    <AddIcon sx={{ fontSize: 80 }}></AddIcon>
                    <RegisterDoctor
                      open={registerOpen}
                      handleMOpen={handleRMOpen}
                      handleMClose={handleRMClose}
                      hospitalname={hospitalData.name}
                      onRegist={(formData) =>
                        RegistDoc(hospitalData.hospitalId, formData)
                      }
                    ></RegisterDoctor>
                  </div>
                )}
              </div>
            </DoctorInfo>
            <Review buttonData={buttonData}>
              <div className="flex justify-between">
                <h1 className="text-4xl font-bold">리뷰</h1>
                <div className="my-4">
                  <FormControl sx={{ m: 1, minWidth: 200 }}>
                    <InputLabel id="demo-simple-select-autowidth-label">
                      리뷰 정보
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-autowidth-label"
                      id="demo-simple-select-autowidth"
                      value={state}
                      onChange={stateChange}
                      autoWidth
                      label="보기옵션"
                    >
                      <MenuItem value={0} sx={{ m: 1, minWidth: 180 }}>
                        평점 높은순
                      </MenuItem>
                      <MenuItem value={1} sx={{ m: 1, minWidth: 180 }}>
                        평점 낮은순
                      </MenuItem>
                      <MenuItem value={2} sx={{ m: 1, minWidth: 180 }}>
                        최신 순
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ m: 1, minWidth: 200 }}>
                    <InputLabel id="demo-simple-select-autowidth-label">
                      의사 목록
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-autowidth-label"
                      id="demo-simple-select-autowidth"
                      value={dreview}
                      onChange={dreviewChange}
                      autoWidth
                      label="보기옵션"
                    >
                      <MenuItem value={0} sx={{ m: 1, minWidth: 180 }}>
                        전체
                      </MenuItem>
                      {doctorIds.map((doctor) => (
                        <MenuItem
                          key={doctor.doctorId}
                          value={doctor.doctorId}
                          sx={{ m: 1, minWidth: 180 }}
                        >
                          {doctor.doctorName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
              <div className="flex my-11 justify-center">
                <h1 className="text-7xl font-bold">{hospitalData.score}</h1>
                <div className="flex-col text-center ms-5">
                  <Rating
                    name="read-only"
                    value={hospitalData.score}
                    readOnly
                    precision={0.1}
                    sx={{
                      fontSize: "60px",
                    }}
                  />
                  <h1>{reviewData.length}개의 리뷰</h1>
                </div>
              </div>
              <Container maxWidth="sm">
                <div>
                  {filteredReviewData
                    .slice((page - 1) * reviewPerPage, page * reviewPerPage)
                    .map((review) => (
                      <div key={review.reviewId}>
                        {
                          <div className="flex-col">
                            <Grid container spacing={1} className="my-10">
                              <Grid item xs={3}>
                                <h1 className="text-lg font-bold">
                                  {review.nickname}
                                </h1>
                              </Grid>
                              <Grid item xs={2}>
                                <h1 className="text-xl font-bold">
                                  {review.score} 점
                                </h1>
                              </Grid>
                              <Grid item xs={5}>
                                <Rating
                                  name="read-only"
                                  value={review.score}
                                  readOnly
                                  precision={1}
                                  size={"medium"}
                                />
                              </Grid>
                              <Grid item xs={2}>
                                <NotificationImportantIcon
                                  sx={{ color: red[500] }}
                                />
                              </Grid>
                              <Grid item xs={2}>
                                <h1>{review.doctorName}</h1>
                              </Grid>
                              <Grid item xs={10}>
                                <h1 className="text-gray-500">
                                  {review.updateDate}
                                </h1>
                              </Grid>
                              {/* <Grid item xs={8}>
                                <h1 className="text-gray-500">
                                  {review.category}
                                </h1>
                              </Grid> */}
                              <Grid item xs={12}>
                                <h1 className="text-2xl">{review.content}</h1>
                              </Grid>
                            </Grid>
                          </div>
                        }
                      </div>
                    ))}
                  <div className="flex justify-center">
                    <Stack spacing={2}>
                      <Pagination
                        count={Math.ceil(
                          filteredReviewData.length / reviewPerPage,
                        )}
                        page={page}
                        onChange={handleChange}
                      />
                    </Stack>
                  </div>
                </div>
              </Container>
            </Review>
          </Content>
          {/* 상담 예약 들어가는 곳 */}
          <Content style={{ width: "350px" }}></Content>
          <Content style={{ width: "350px" }}>
            {/* merge 하거나 git pull 하기 전에 삭제 */}
            <SelectDoctorAndTime
              doctors={doctorData}
              hospitalId={hospitalData.hospitalId}
              hospitalName={hospitalName}
            />
            <DetailReservation
              doctors={doctorData}
              hospitalId={hospitalData.hospitalId}
              hospitalName={hospitalName}
            />
          </Content>
        </Layout>
      </Containers>
      <Footer />
    </div>
  );
};

export default DetailHospital;
