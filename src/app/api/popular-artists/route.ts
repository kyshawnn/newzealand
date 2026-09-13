import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const artists = [
    {
      name: 'Bernadya',
      artistId: 'UCUn9Xjvg8fwqpa58-_XO6zw',
      image:
        'https://lh3.googleusercontent.com/hxROE1fvLWSxUYAFV3IgMp5vvjN91Jx6oS6uwSVyYN9_fb3I6PLaRa3Ufb4A0awxq4J5UoPFQAQM-Q=w300-h300-p-l90-rj',
    },
    {
      name: 'Sal Priadi',
      artistId: 'UCs1Iq1CQQDwTUUUtVhXmK6g',
      image:
        'https://lh3.googleusercontent.com/wmItRT4hTCJrmnlsh_JBgOeBXww9mquXhrNR0oW3_hPW9LsZ5Z2grMij01EaENdt6ensOJfKm-OCBKqJ=w300-h300-p-l90-rj',
    },
    {
      name: 'Juicy Luicy',
      artistId: 'UCYBtTmBP2QgHgalgsv2v5LA',
      image:
        'https://yt3.googleusercontent.com/DDebW5VciXI_oMRQC1cRIWlpDIWVaS8c_CbcCkf89YeHVziP9lkgA0xUZmmVRxGKmC3qmppuMtvIsa5U=w300-h300-p-l90-rj',
    },
    {
      name: 'Hindia',
      artistId: 'UCzhVLh7xVyH3MpqO_KY6SYg',
      image:
        'https://yt3.googleusercontent.com/8ImMAMQSD4FA6-gdqCZWSFaB-drHvkdfiFcFAk7Mcyy56ctfWD-Xxno-CHfGC4L6Ql8aR61XT0vX0F4b=w300-h300-p-l90-rj',
    },
    {
      name: 'Mahalini',
      artistId: 'UCa1eYN7cwBQrOFQLt_K8c-Q',
      image:
        'https://yt3.googleusercontent.com/VdgLqr3Sno_U1IXj9qzk43azloCsjBeDy6MpFjfD8kMmco0AeL81qow0cpHynDfpaVlujCY11O7QO4d6=w300-h300-p-l90-rj',
    },
    {
      name: 'Ghea Indrawari',
      artistId: 'UCWoBKSc1j2KkPd5j_f8Qfaw',
      image:
        'https://lh3.googleusercontent.com/x0EJtjVijA3xtPZQejke6OMBfoBU7l6GY2j6LScOFFwIfm4x0ZVyhrN3pLaddKiM8yUA5EDFzu0krLg=w300-h300-p-l90-rj',
    },
    {
      name: 'Tulus',
      artistId: 'UC_DHlXllTSMB8pTC38_leFg',
      image:
        'https://yt3.googleusercontent.com/h8P1jEIZLM8lkMxNA6Nbq98b43wcqllJSNmcZTCRPAB-F6rG_0Nqw5w7fwou0PN1QGwSW5viwWD5NV0=w300-h300-p-l90-rj',
    },
    {
      name: 'Nadhif Basalamah',
      artistId: 'UCbwAI7LydeNSRU-bywK0EHw',
      image:
        'https://yt3.googleusercontent.com/jjFbDHc_GFI6lVSSRPGWMrh71fJ16iZYMccLFbkN_Jq6uR-QYXzgRwFDSuZeDpOuAbIIzNnPAPDZgAHv=w300-h300-p-l90-rj',
    },
    {
      name: 'XXXTentacion',
      artistId: 'UCnAcxgRZ065f_eXK1o85c1w',
      image:
        'https://yt3.googleusercontent.com/No3I8pA9ows2dy6NElEr9mCXLzYxgjVvsQr7h69C03palsH1u8Q8iw-sAAUxav599Wmi64up8lbDGbI=w300-h300-p-l90-rj',
    },
  ];

  return NextResponse.json(artists);
}
