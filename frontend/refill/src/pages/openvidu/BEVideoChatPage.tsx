import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  OpenVidu,
  Session,
  StreamManager,
  Publisher,
  Device,
  Stream,
} from "openvidu-browser";
import axios from "axios";
import UserVideoComponent from "./UserVideoComponent";
import Button from "components/elements/Button";
// import styled from "@emotion/styled";
import { useSelector } from "react-redux";
import { RootState } from "store/reducers";
import PrevComponent from "components/openvidu/prevComponent";
// import { ScreenComponent } from "components/openvidu/screenComponent";
import ChatLog from "components/openvidu/chatLogComponent";
// import Chat from "../../components/openvidu/chatComponent";

interface MessageList {
  connectionId: string;
  nickname: string;
  message: string;
}

interface Chat {
  messageList: MessageList[];
  message: string;
}

// 이쪽도 수정필요
const APPLICATION_SERVER_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost/";

const BEVideoChatPage: React.FC = () => {
  const [mySessionId, setMySessionId] = useState("sessionA");
  const [myUserName, setMyUserName] = useState(
    "Participant" + Math.floor(Math.random() * 100),
  );
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [screenSession, setScreenSession] = useState<Session | undefined>(
    undefined,
  );
  const [mainStreamManager, setMainStreamManager] = useState<
    StreamManager | undefined
  >(undefined);
  const [publisher, setPublisher] = useState<Publisher | undefined>(undefined);
  const [screenPublisher, setScreenPublisher] = useState<Publisher | undefined>(
    undefined,
  );
  const [toggleScreenPublisher, setToggleScreenPublisher] =
    useState<boolean>(true);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const [currentVideoDevice, setCurrentVideoDevice] = useState<
    Device | undefined
  >(undefined);
  const [showChat, setShowChat] = useState(false);
  const location = useLocation();

  const inputref = useRef<HTMLTextAreaElement>(null);
  const chatLogref = useRef<HTMLInputElement>(null);
  const [chat, setChat] = useState<Chat>({
    messageList: [],
    message: "",
  });
  const { messageList, message } = chat;
  const [userData, setuserData] = useState({
    address: "",
    birthDay: "",
    email: "",
    name: "",
    nickname: "",
    profileImg: null,
    tel: "",
  });

  const token = useSelector((state: RootState) => state.login.token);
  const islogin = useSelector((state: RootState) => state.login.islogin);
  const ismember = useSelector((state: RootState) => state.login.ismember);
  const ishospital = useSelector((state: RootState) => state.login.ishospital);

  // 유저 정보 가져오기
  const navigate = useNavigate();

  useEffect(() => {
    console.log("멤버야?", ismember);
    console.log("병원???", ishospital);
    console.log("islogin 은 ????", islogin);
    if (islogin && ismember) {
      axios
        .get("api/v1/member/mypage", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        .then((response) => {
          console.log(response.data);
          setuserData(response.data);
        })
        .catch((error) => {
          console.log("에러:", error);
        });
    } else if (islogin && ishospital) {
      console.log("병원입니다.");
    } else {
      navigate("/");
      alert("접근 권한이 없습니다.");
    }
  }, []);

  function handleChange(event: any) {
    if (typeof event.target.value === "string") {
      console.log(chat);
      setChat((prev) => ({
        ...prev,
        message: event.target.value,
      }));
    }
  }

  function handlePresskey(event: any) {
    if (event.key === "Enter") {
      sendMessage();
      event.target.value = "";
    }
  }

  function sendMessage() {
    if (chat.message) {
      const data = {
        message: chat.message,
        nickname: userData.nickname,
      };
      if (session) {
        session.signal({
          data: JSON.stringify(data),
          type: "chat",
        });
      }
    }
    setChat((prev) => ({
      ...prev,
      message: "",
    }));
  }

  // 여기까지 채팅 부분

  // 강제로 창 종료시 동작
  useEffect(() => {
    window.addEventListener("beforeunload", onbeforeunload);
    return () => {
      window.removeEventListener("beforeunload", onbeforeunload);
    };
  }, []);

  // mainStreamManager가 없을 경우 publisher로 설정
  useEffect(() => {
    if (!mainStreamManager && publisher) {
      setMainStreamManager(publisher);
    }
  }, [mainStreamManager, publisher, subscribers]);

  // 나갈때 동작
  const onbeforeunload = () => {
    // session 떠나기
    leaveSession();
  };

  const handleChangeSessionId = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMySessionId(e.target.value);
  };

  const handleChangeUserName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMyUserName(e.target.value);
  };
  //

  // 메인 스트림과 클릭된 서브 스트림을 전환하는 함수
  const toggleMainAndSubStream = (target: StreamManager) => {
    if (target === publisher) {
      // 클릭된 스트림이 현재 publisher일 경우
      setMainStreamManager(publisher); // mainStreamManager를 publisher로 설정
    } else {
      setMainStreamManager(target); // 클릭된 서브 스트림을 메인 스트림으로 설정
    }
  };

  const deleteSubscriber = (streamManager: StreamManager) => {
    setSubscribers((prevSubscribers) =>
      prevSubscribers.filter((sub) => sub !== streamManager),
    );
  };

  // 의사전용 joinsession
  const joinSession = async () => {
    // console.log("엥???????????????",token_v2)
    const OV = new OpenVidu();
    const mySession = OV.initSession();
    setSession(mySession);

    // Specify the actions when events take place in the session
    mySession.on("streamCreated", (event) => {
      const subscriber = mySession.subscribe(event.stream, undefined);
      setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]);
    });

    mySession.on("streamDestroyed", (event) => {
      deleteSubscriber(event.stream.streamManager);
    });

    mySession.on("exception", (exception) => {
      console.warn(exception);
    });

    mySession.on("signal:chat", (event) => {
      if (typeof event.data === "string") {
        const data = JSON.parse(event.data);
        if (event.from) {
          messageList.push({
            connectionId: event.from.connectionId,
            nickname: userData.nickname,
            message: data.message,
          });
          setChat((prev) => ({ ...prev, messageList }));
        }
        // scrollToBottom()
      }
    });

    try {
      const token = await getToken();
      await mySession.connect(token);

      const publisher = await OV.initPublisherAsync("container-video", {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
        resolution: "800x1000",
        frameRate: 30,
        insertMode: "APPEND",
        mirror: false,
      });

      mySession.publish(publisher);
      console.log(publisher);

      // 이제부터 screen 부분
      const OVS = await new OpenVidu();
      const myScreenSession = await OVS.initSession();
      await setScreenSession(myScreenSession);

      const tokenScreen = await getToken();
      await myScreenSession.connect(tokenScreen, { clientData: myUserName });
      const screenPublisher = await OV.initPublisherAsync("container-screen", {
        videoSource: "screen", // 화면 공유를 위해 'screen'을 지정
        publishAudio: false, // 오디오를 포함할 것인지 여부
        publishVideo: true, // 비디오를 포함할 것인지 여부
        resolution: "1280x720", // 스크린 공유의 해상도
        frameRate: 30, // 스크린 공유의 프레임 레이트
        insertMode: "APPEND", // 비디오가 타겟 엘리먼트에 삽입되는 방식
        mirror: false, // 로컬 비디오 미러링 여부
      });

      await setScreenPublisher(screenPublisher);
      myScreenSession.publish(screenPublisher);

      const devices = await OV.getDevices();
      const videoDevices = devices.filter(
        (device: any) => device.kind === "videoinput",
      );

      const currentVideoDeviceId = publisher.stream
        .getMediaStream()
        .getVideoTracks()[0]
        .getSettings().deviceId;
      const currentVideoDevice = videoDevices.find(
        (device: any) => device.deviceId === currentVideoDeviceId,
      );
      setCurrentVideoDevice(currentVideoDevice);
      setMainStreamManager(publisher);
      setPublisher(publisher);
      console.log(subscribers);
    } catch (error) {
      console.log("There was an error connecting to the session:", error);
    }
  };

  // screenShare 토글 버튼
  const toggleScreenShare = () => {
    if (screenSession && screenPublisher && toggleScreenPublisher) {
      // disconnect
      setToggleScreenPublisher(false);
      screenSession.unpublish(screenPublisher);
    } else if (screenSession && screenPublisher) {
      // connect
      setToggleScreenPublisher(true);
      screenSession.publish(screenPublisher);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    if (screenSession) {
      screenSession.disconnect();
    }

    // Empty all properties...
    setSession(undefined);
    setScreenSession(undefined);
    setSubscribers([]);
    setMySessionId("SessionA");
    setMyUserName("Participant" + Math.floor(Math.random() * 100));
    setMainStreamManager(undefined);
    setPublisher(undefined);
    setScreenPublisher(undefined);

    navigate("/");
  };

  const camOnOff = () => {
    if (session) {
      publisher?.publishVideo(!publisher?.stream?.videoActive);
      console.log(subscribers);
    }
  };

  const soundOnOff = () => {
    if (session) {
      publisher?.publishAudio(!publisher?.stream?.audioActive);
      console.log(subscribers);
      console.log(subscribers.length);
    }
  };

  const soundControl = () => {
    if (session) {
      console.log(session);
      console.log(publisher);
    }
  };

  const accessToken = token;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const getToken = async () => {
    const sessionId = await createSession(mySessionId);
    return await createToken(sessionId);
  };

  const createSession = async (sessionId: string) => {
    const response = await axios.post(
      APPLICATION_SERVER_URL + "api/sessions",
      { customSessionId: sessionId },
      {
        headers: headers,
      },
    );

    console.log(response.data);

    return response.data; // The sessionId
  };

  const createToken = async (sessionId: string) => {
    const response = await axios.post(
      APPLICATION_SERVER_URL + "api/sessions/" + sessionId + "/connections",
      {},
      {
        headers: headers,
      },
    );
    return response.data; // The token
  };

  const handleShowBox = () => {
    console.log(showChat);
    setShowChat(!showChat);
  };

  return (
    <div>
      {session ? (
        <div
          className="container"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            backgroundColor: "white",
            padding: "20px 20px",
            boxSizing: "border-box",
          }}
        >
          <div
            id="session"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "between",
              minWidth: "100%",
              minHeight: "100%",
            }}
          >
            <div className="flex justify-between" style={{ width: "100%" }}>
              <div
                style={{
                  position: "relative",
                  width: "50%",
                  minWidth: "500px",
                }}
              >
                <UserVideoComponent streamManager={mainStreamManager} />
                {subscribers && mainStreamManager === publisher ? (
                  subscribers
                    .filter((sub) => sub.stream.typeOfVideo !== "SCREEN")
                    .map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          width: "25%",
                          minWidth: "150px",
                          position: "absolute",
                          top: "30px",
                          left: "30px",
                        }}
                        onClick={() => toggleMainAndSubStream(sub)}
                      >
                        <UserVideoComponent streamManager={sub} />
                      </div>
                    ))
                ) : publisher !== undefined ? (
                  <div
                    style={{
                      width: "25%",
                      minWidth: "150px",
                      position: "absolute",
                      top: "30px",
                      left: "30px",
                    }}
                    onClick={() => toggleMainAndSubStream(publisher)}
                  >
                    <UserVideoComponent streamManager={publisher} />
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "48%",
                  minHeight: "100%",
                }}
              >
                <PrevComponent>
                  <div>
                    {toggleScreenPublisher && ishospital ? (
                      <UserVideoComponent streamManager={screenPublisher} />
                    ) : null}
                  </div>
                  {ismember
                    ? subscribers
                        .filter((sub) => sub.stream.typeOfVideo === "SCREEN")
                        .map((sub) => (
                          <div key={sub.id}>
                            <UserVideoComponent streamManager={sub} />
                          </div>
                        ))
                    : null}
                  {ishospital ? (
                    <div
                      style={{
                        display: toggleScreenPublisher ? "none" : "block",
                      }}
                    >
                      여기에 이제 진짜 이전 자료들이 들어옵니다.
                    </div>
                  ) : null}
                  {ismember &&
                  subscribers.filter(
                    (sub) => sub.stream.typeOfVideo === "SCREEN",
                  ).length === 0 ? (
                    <div>여기에 이제 진짜 이전 자료들이 들어옵니다.</div>
                  ) : null}
                </PrevComponent>
                <textarea
                  placeholder="진료 소견서를 작성해주세요. 소견서는 자동 저장됩니다."
                  style={{
                    marginTop: "20px",
                    height: "30%",
                    backgroundColor: "#eeeeee",
                    border: "2px solid black",
                  }}
                ></textarea>
              </div>
            </div>
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                left: "0",
                padding: "20px",
                width: "100%",
              }}
            >
              <div
                id="session-footer"
                className="flex justify-between items-center"
                style={{ width: "100%" }}
              >
                <h1 id="session-title" className="text-xl font-bold">
                  {mySessionId}
                </h1>
                <div>
                  <Button content="캠 on/off" onClick={camOnOff} />
                  <Button content="소리 on/off" onClick={soundOnOff} />
                  <Button content="소리조절" onClick={soundControl} />
                  <Button
                    width="60px"
                    content="화면"
                    onClick={toggleScreenShare}
                    customStyles={{
                      display: ishospital ? "inline-block" : "none",
                    }}
                  />
                  <Button content="상담 나가기" onClick={leaveSession} />
                </div>
                <div>
                  <Button content="채팅" onClick={handleShowBox} />
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "70px",
                right: "70px",
                minWidth: "350px",
                minHeight: "500px",
                backgroundColor: "#eeeeee",
                display: showChat ? "block" : "none",
                borderRadius: "7px",
                border: "2px solid grey",
              }}
            >
              <div ref={chatLogref} style={{ padding: "20px" }}>
                {messageList.map(({ message, nickname, connectionId }, idx) => (
                  <ChatLog
                    key={idx}
                    chatData={{
                      mySessionId: session.connection.connectionId,
                      connectionId: connectionId,
                      nickname: nickname,
                      message: message,
                    }}
                  ></ChatLog>
                ))}
              </div>
              <div>
                <textarea
                  onChange={handleChange}
                  onKeyUp={handlePresskey}
                  ref={inputref}
                  style={{
                    width: "100%",
                    height: "100px",
                    padding: "5px",
                    borderBottomLeftRadius: "7px",
                    borderBottomRightRadius: "7px",
                    position: "absolute",
                    bottom: "0",
                  }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div id="join">
          <div
            id="join-dialog"
            className="bg-white rounded p-4 mx-auto"
            style={{ backgroundColor: "#e8e8e8" }}
          >
            <h1 className="text-center"> Join a video session </h1>
            <form className="space-y-4" onSubmit={joinSession}>
              <div>
                <label>Participant: </label>
                <input
                  className="form-input block w-full"
                  type="text"
                  id="userName"
                  value={myUserName}
                  onChange={handleChangeUserName}
                  required
                />
              </div>
              <div>
                <label> Session: </label>
                <input
                  className="form-input block w-full"
                  type="text"
                  id="sessionId"
                  value={mySessionId}
                  onChange={handleChangeSessionId}
                  required
                />
              </div>
              <div className="text-center">
                <input
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  name="commit"
                  type="submit"
                  value="JOIN"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BEVideoChatPage;
