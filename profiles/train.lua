-- Custom OSRM train profile for Indian Railways
-- Based on https://github.com/railnova/osrm-train-profile

api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')

function setup()
  return {
    properties = {
      max_speed_for_map_matching = 160/3.6, -- 160 kph
      weight_name = 'duration',
      process_call_tagless_node = false,
      u_turn_penalty = 60,
      continue_straight_at_waypoint = true,
      use_turn_restrictions = false,
    },
    default_speed = 80, -- kph, Indian Railways average
    max_speed = 160,    -- Gatimaan Express max
  }
end

function process_node(profile, node, result, relations)
  -- Accept railway stations and halts as waypoints
  local railway = node:get_value_by_key("railway")
  if railway == "station" or railway == "halt" or railway == "stop" then
    result.barrier = false
  end
end

function process_way(profile, way, result, relations)
  local railway = way:get_value_by_key("railway")

  -- Only process railway=rail ways
  if railway ~= "rail" then
    return
  end

  -- Skip abandoned/disused/construction tracks
  local dominated = way:get_value_by_key("railway:preserved")
  if dominated == "yes" then
    return
  end

  local service = way:get_value_by_key("service")

  -- Determine speed
  local maxspeed = tonumber(way:get_value_by_key("maxspeed"))
  local speed = profile.default_speed

  if maxspeed and maxspeed > 0 then
    speed = math.min(maxspeed, profile.max_speed)
  end

  -- Reduce speed for service/spur/yard tracks
  if service == "spur" or service == "yard" or service == "siding" or service == "crossover" then
    speed = math.min(speed, 30)
  end

  -- Set forward and backward mode (bidirectional)
  result.forward_speed = speed
  result.backward_speed = speed
  result.forward_mode = mode.train
  result.backward_mode = mode.train
  result.forward_rate = speed
  result.backward_rate = speed

  -- Name for the route
  local name = way:get_value_by_key("name") or ""
  result.name = name
end

function process_turn(profile, turn)
  if turn.is_u_turn then
    turn.duration = turn.duration + profile.properties.u_turn_penalty
  end
end

return {
  setup = setup,
  process_way = process_way,
  process_node = process_node,
  process_turn = process_turn,
}
