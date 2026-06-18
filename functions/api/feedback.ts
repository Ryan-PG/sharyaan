export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const {
      type,
      message,
      email,
      station,
      route_from,
      route_to
    } = body;

    if (!message || message.length < 10) {
      return new Response("Message too short", { status: 400 });
    }

    // await env.DB.prepare(
    //   `INSERT INTO feedback
    //   (type, message, email, station, route_from, route_to, created_at)
    //   VALUES (?, ?, ?, ?, ?, ?, ?)`
    // )
    //   .bind(
    //     type,
    //     message,
    //     email || null,
    //     station || null,
    //     route_from || null,
    //     route_to || null,
    //     new Date().toISOString()
    //   )
    //   .run();

    return Response.json({ ok: true });

  } catch (err) {
    console.error(err);
    return Response.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}