import { useEffect } from "react";

export default function BookingWidget() {
  useEffect(() => {
    if (window.jQuery && window.jQuery.fn.bb_resBookingBox) {
      window.jQuery("#bb_resBookingBox").bb_resBookingBox({
          btnContainer: "bb_resBookingBox", 
          headerColor: "#56c5d0", 
          bodyColor: "rgba(0,0,0,0.52)", 
          showborder: false, 
          BorderColor: "rgba(0, 0, 0, 0.52)", 
          BorderWidth: 2, 
          BorderType: "solid", 
          FontFamily: "Arial, Helvetica, sans-serif", 
          BodyLanguage:"en", 
          FontSize: "12", 
          TextColor: "#ffffff", 
          InputBorderColor: "#fff", 
          InputbackColor: "#fff", 
          InputTextColor: "#000", 
          ButnBackColor: "#c9a84c", 
          ButnBorderColor: "#c9a84c", 
          ButnTextColor: "#000", 
          HeaderTextColor: "#000000", 
          HeaderFontSize: "15", 
          ShowHeader: "0", 
          boxwidth: "100", 
          boxwidthtype: "TYPE_PER", 
          ShowInlineCSS: "1", 
          type: "htype", 
          acr:false, 
          ShowChild:false, 
          rooms:false, 
          promotion:true, 
          defaultadult:10, 
          defaultchild:10, 
          defaultroom:16, 
          ShowNights:false, 
          Nonights:15, 
          HTextCaption: "Reservation", 
          BtnTextCaption: "Book Now", 
          LblPromoCaption: "Promotion", 
          LblChkOutCaption: "Check Out", 
          Calinit: true, 
          CalShowOn: "both", 
          CalDefaultDt: "+0w", 
          CalChangeMonth: true, 
          CalMinDate: "0", 
          CalMaxDate: "", 
          CalDtFormat: "dd-mm-yy", 
          CalCutoffDays: "1", 
          CalImage: "1px -24px", 
          CalBackColor: "#a0f2ea", 
          CalHeaderColor: "#F9E8E0", 
          CalCellActiveColor: "#101414", 
          CalCellInActiveColor: "#c8dbda", 
          LblArrivalCaption: "Check In", 
          LblNightsCaption: "Nights", 
          LblAdultsCaption: "Adult", 
          LblChildsCaption: "Child", 
          LblRoomsCaption: "Rooms", 
          LblPerRoomCaption: "Per Room", 
          HotelId:"rajbaripalace", 
      });
    }
  }, []);

  return (
    <div className="outerbewrap">
      <div className="bewarp">
        <form
          style={{ margin: 0 }}
          action="https://live.ipms247.com/booking/book-rooms-rajbaripalace"
          method="post"
          name="_resBBBox"
          target="_blank"
        >
          {/* ✅ THIS is the important container */}
          <div id="bb_resBookingBox" className="bb_resbox"></div>
        </form>
      </div>
    </div>
  );
}