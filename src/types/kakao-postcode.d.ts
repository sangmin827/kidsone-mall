declare global {
  interface Window {
    kakao: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          userSelectedType: "R" | "J";
          bname: string;
          buildingName: string;
          apartment: "Y" | "N";
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

export {};
